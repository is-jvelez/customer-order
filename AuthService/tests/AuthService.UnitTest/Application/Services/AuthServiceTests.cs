using AuthService.Application.DTOs.Request;
using AuthService.Application.Services;
using AuthService.Domain.Entities;
using AuthService.Domain.Exceptions;
using AuthService.Domain.Interfaces;
using AuthService.UnitTest.TestCommon;
using FluentAssertions;
using Moq;

namespace AuthService.UnitTest.Application.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepository = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly Mock<ITokenGenerator> _tokenGenerator = new();

    private AuthService.Application.Services.AuthService CreateSut() =>
        new(
            _userRepository.Object,
            _refreshTokenRepository.Object,
            _passwordHasher.Object,
            _tokenGenerator.Object);

    [Fact]
    public async Task RegisterAsync_ShouldThrowUserAlreadyExistsException_WhenEmailAlreadyExists()
    {
        var request = new RegisterRequest("USER@EXAMPLE.COM", "StrongP@ss1", "StrongP@ss1");
        _userRepository
            .Setup(x => x.ExistsAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RegisterAsync(request);

        await act.Should().ThrowAsync<UserAlreadyExistsException>();
        _passwordHasher.Verify(x => x.Hash(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_ShouldPersistUserAndRefreshToken_WhenRequestIsValid()
    {
        var request = new RegisterRequest("USER@EXAMPLE.COM", "StrongP@ss1", "StrongP@ss1");
        var expiresAt = DateTime.UtcNow.AddDays(7);
        User? capturedUser = null;
        RefreshToken? capturedRefreshToken = null;

        _userRepository
            .Setup(x => x.ExistsAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _userRepository
            .Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((user, _) => capturedUser = user)
            .Returns(Task.CompletedTask);
        _passwordHasher
            .Setup(x => x.Hash("StrongP@ss1"))
            .Returns("hashed-password");
        _tokenGenerator
            .Setup(x => x.GenerateAccessToken(It.IsAny<User>()))
            .Returns("access-token");
        _tokenGenerator
            .Setup(x => x.GenerateRefreshToken())
            .Returns(("refresh-token", expiresAt));
        _refreshTokenRepository
            .Setup(x => x.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .Callback<RefreshToken, CancellationToken>((token, _) => capturedRefreshToken = token)
            .Returns(Task.CompletedTask);
        var sut = CreateSut();

        var result = await sut.RegisterAsync(request);

        capturedUser.Should().NotBeNull();
        capturedUser!.Email.Should().Be("user@example.com");
        capturedUser.PasswordHash.Should().Be("hashed-password");

        capturedRefreshToken.Should().NotBeNull();
        capturedRefreshToken!.Token.Should().Be("refresh-token");
        capturedRefreshToken.ExpiresAt.Should().Be(expiresAt);

        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token");
        result.ExpiresAt.Should().Be(expiresAt);

        _refreshTokenRepository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_ShouldThrowInvalidCredentialsException_WhenUserDoesNotExist()
    {
        var request = new LoginRequest("user@example.com", "StrongP@ss1");
        _userRepository
            .Setup(x => x.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.LoginAsync(request);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
        _refreshTokenRepository.Verify(x => x.RevokeAllForUserAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_ShouldThrowInvalidCredentialsException_WhenPasswordVerificationFails()
    {
        var request = new LoginRequest("user@example.com", "wrong");
        var user = DomainEntityFactory.CreateUser(id: 7, email: "user@example.com", passwordHash: "stored");
        _userRepository
            .Setup(x => x.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher
            .Setup(x => x.Verify("wrong", "stored"))
            .Returns(false);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.LoginAsync(request);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
        _refreshTokenRepository.Verify(x => x.RevokeAllForUserAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_ShouldIssueTokensAndRevokePreviousOnes_WhenCredentialsAreValid()
    {
        var request = new LoginRequest("USER@example.com", "StrongP@ss1");
        var user = DomainEntityFactory.CreateUser(id: 11, email: "user@example.com", passwordHash: "stored");
        var expiresAt = DateTime.UtcNow.AddDays(7);

        _userRepository
            .Setup(x => x.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher
            .Setup(x => x.Verify("StrongP@ss1", "stored"))
            .Returns(true);
        _tokenGenerator
            .Setup(x => x.GenerateAccessToken(user))
            .Returns("access-token");
        _tokenGenerator
            .Setup(x => x.GenerateRefreshToken())
            .Returns(("refresh-token", expiresAt));
        _refreshTokenRepository
            .Setup(x => x.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var sut = CreateSut();

        var result = await sut.LoginAsync(request);

        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token");
        _refreshTokenRepository.Verify(x => x.RevokeAllForUserAsync(11, It.IsAny<CancellationToken>()), Times.Once);
        _refreshTokenRepository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldThrowTokenNotFoundException_WhenTokenDoesNotExist()
    {
        var request = new RefreshTokenRequest("missing-token");
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("missing-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((RefreshToken?)null);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RefreshTokenAsync(request);

        await act.Should().ThrowAsync<TokenNotFoundException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldThrowTokenRevokedException_WhenTokenIsRevoked()
    {
        var token = DomainEntityFactory.CreateRefreshToken(userId: 4, token: "revoked-token", expiresAt: DateTime.UtcNow.AddDays(1));
        token.Revoke();
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("revoked-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(token);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RefreshTokenAsync(new RefreshTokenRequest("revoked-token"));

        await act.Should().ThrowAsync<TokenRevokedException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldThrowTokenRevokedException_WhenTokenIsExpired()
    {
        var token = DomainEntityFactory.CreateRefreshToken(userId: 4, token: "expired-token", expiresAt: DateTime.UtcNow.AddSeconds(-1));
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("expired-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(token);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RefreshTokenAsync(new RefreshTokenRequest("expired-token"));

        await act.Should().ThrowAsync<TokenRevokedException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldThrowInvalidCredentialsException_WhenTokenOwnerDoesNotExist()
    {
        var token = DomainEntityFactory.CreateRefreshToken(userId: 31, token: "refresh-token", expiresAt: DateTime.UtcNow.AddHours(1));
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("refresh-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(token);
        _userRepository
            .Setup(x => x.GetByIdAsync(31, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RefreshTokenAsync(new RefreshTokenRequest("refresh-token"));

        await act.Should().ThrowAsync<InvalidCredentialsException>();
        token.IsRevoked.Should().BeTrue();
        _refreshTokenRepository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldRevokeOldAndPersistNewRefreshToken_WhenTokenIsValid()
    {
        var existing = DomainEntityFactory.CreateRefreshToken(
            userId: 8,
            token: "old-token",
            expiresAt: DateTime.UtcNow.AddMinutes(30));
        var user = DomainEntityFactory.CreateUser(id: 8, email: "user@example.com", passwordHash: "stored");
        var expiresAt = DateTime.UtcNow.AddDays(7);
        RefreshToken? newRefreshToken = null;

        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("old-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        _userRepository
            .Setup(x => x.GetByIdAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _tokenGenerator
            .Setup(x => x.GenerateAccessToken(user))
            .Returns("new-access");
        _tokenGenerator
            .Setup(x => x.GenerateRefreshToken())
            .Returns(("new-refresh", expiresAt));
        _refreshTokenRepository
            .Setup(x => x.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .Callback<RefreshToken, CancellationToken>((token, _) => newRefreshToken = token)
            .Returns(Task.CompletedTask);
        var sut = CreateSut();

        var result = await sut.RefreshTokenAsync(new RefreshTokenRequest("old-token"));

        existing.IsRevoked.Should().BeTrue();
        newRefreshToken.Should().NotBeNull();
        newRefreshToken!.UserId.Should().Be(8);
        newRefreshToken.Token.Should().Be("new-refresh");

        result.AccessToken.Should().Be("new-access");
        result.RefreshToken.Should().Be("new-refresh");
        _refreshTokenRepository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task RevokeTokenAsync_ShouldThrowTokenNotFoundException_WhenTokenDoesNotExist()
    {
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((RefreshToken?)null);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RevokeTokenAsync(new RevokeTokenRequest("missing"));

        await act.Should().ThrowAsync<TokenNotFoundException>();
    }

    [Fact]
    public async Task RevokeTokenAsync_ShouldThrowTokenRevokedException_WhenTokenAlreadyRevoked()
    {
        var token = DomainEntityFactory.CreateRefreshToken(token: "revoked-token");
        token.Revoke();
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("revoked-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(token);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.RevokeTokenAsync(new RevokeTokenRequest("revoked-token"));

        await act.Should().ThrowAsync<TokenRevokedException>();
    }

    [Fact]
    public async Task RevokeTokenAsync_ShouldMarkTokenAsRevoked_WhenTokenIsActive()
    {
        var token = DomainEntityFactory.CreateRefreshToken(token: "active-token");
        _refreshTokenRepository
            .Setup(x => x.GetByTokenAsync("active-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(token);
        var sut = CreateSut();

        await sut.RevokeTokenAsync(new RevokeTokenRequest("active-token"));

        token.IsRevoked.Should().BeTrue();
        _refreshTokenRepository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAuthenticatedUserAsync_ShouldThrowInvalidCredentialsException_WhenUserDoesNotExist()
    {
        _userRepository
            .Setup(x => x.GetByIdAsync(404, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        var sut = CreateSut();

        Func<Task> act = async () => await sut.GetAuthenticatedUserAsync(404);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }

    [Fact]
    public async Task GetAuthenticatedUserAsync_ShouldReturnMappedUser_WhenUserExists()
    {
        var user = DomainEntityFactory.CreateUser(id: 17, email: "me@example.com", passwordHash: "ignored");
        _userRepository
            .Setup(x => x.GetByIdAsync(17, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        var sut = CreateSut();

        var result = await sut.GetAuthenticatedUserAsync(17);

        result.Id.Should().Be(17);
        result.Email.Should().Be("me@example.com");
        result.CreatedAt.Should().Be(user.CreatedAt);
    }
}
