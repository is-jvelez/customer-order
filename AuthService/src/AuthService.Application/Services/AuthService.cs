using AuthService.Application.DTOs.Request;
using AuthService.Application.DTOs.Response;
using AuthService.Application.Interfaces;
using AuthService.Application.Mappings;
using AuthService.Domain.Entities;
using AuthService.Domain.Exceptions;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

/// <summary>Implementación del servicio de autenticación.</summary>
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenGenerator _tokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHasher passwordHasher,
        ITokenGenerator tokenGenerator)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    /// <summary>Registra un nuevo usuario y emite tokens.</summary>
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();

        if (await _userRepository.ExistsAsync(normalizedEmail, cancellationToken))
            throw new UserAlreadyExistsException(request.Email);

        var passwordHash = _passwordHasher.Hash(request.Password);
        var user = User.Create(normalizedEmail, passwordHash);

        await _userRepository.AddAsync(user, cancellationToken);

        var accessToken = _tokenGenerator.GenerateAccessToken(user);
        var (refreshTokenValue, expiresAt) = _tokenGenerator.GenerateRefreshToken();

        var refreshToken = RefreshToken.Create(user.Id, refreshTokenValue, expiresAt);
        await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, refreshTokenValue, expiresAt, user.ToUserResponse());
    }

    /// <summary>Autentica credenciales, revoca tokens previos y emite nuevos.</summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new InvalidCredentialsException();

        await _refreshTokenRepository.RevokeAllForUserAsync(user.Id, cancellationToken);

        var accessToken = _tokenGenerator.GenerateAccessToken(user);
        var (refreshTokenValue, expiresAt) = _tokenGenerator.GenerateRefreshToken();

        var refreshToken = RefreshToken.Create(user.Id, refreshTokenValue, expiresAt);
        await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, refreshTokenValue, expiresAt, user.ToUserResponse());
    }

    /// <summary>Valida el refresh token, lo revoca y emite un par de tokens nuevo.</summary>
    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);

        if (existing is null)
            throw new TokenNotFoundException();

        if (existing.IsRevoked || existing.ExpiresAt < DateTime.UtcNow)
            throw new TokenRevokedException();

        existing.Revoke();
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        var user = await _userRepository.GetByIdAsync(existing.UserId, cancellationToken);
        if (user is null)
            throw new InvalidCredentialsException();

        var accessToken = _tokenGenerator.GenerateAccessToken(user);
        var (newRefreshTokenValue, expiresAt) = _tokenGenerator.GenerateRefreshToken();

        var newRefreshToken = RefreshToken.Create(user.Id, newRefreshTokenValue, expiresAt);
        await _refreshTokenRepository.AddAsync(newRefreshToken, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, newRefreshTokenValue, expiresAt, user.ToUserResponse());
    }

    /// <summary>Invalida un refresh token activo.</summary>
    public async Task RevokeTokenAsync(RevokeTokenRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);

        if (existing is null)
            throw new TokenNotFoundException();

        if (existing.IsRevoked)
            throw new TokenRevokedException();

        existing.Revoke();
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Retorna los datos del usuario autenticado por su ID extraído del JWT.</summary>
    public async Task<UserResponse> GetAuthenticatedUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);

        if (user is null)
            throw new InvalidCredentialsException();

        return user.ToUserResponse();
    }
}
