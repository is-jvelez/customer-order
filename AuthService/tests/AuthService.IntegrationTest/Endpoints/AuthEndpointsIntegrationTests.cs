using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AuthService.Infrastructure.Persistence.Context;
using AuthService.Shared.Constants;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.IntegrationTest.Endpoints;

public class AuthEndpointsIntegrationTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>, IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _client = factory.CreateClient();
    private readonly AuthApiFactory _factory = factory;

    public async Task InitializeAsync()
    {
        await _factory.ResetDatabaseAsync();
        _client.DefaultRequestHeaders.Authorization = null;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Register_ShouldReturnCreated_WhenRequestIsValid()
    {
        var request = new
        {
            Email = "register@example.com",
            Password = "StrongP@ss1",
            ConfirmPassword = "StrongP@ss1"
        };

        using var response = await _client.PostAsJsonAsync("/api/auth/register", request);
        var envelope = await ReadEnvelopeAsync<AuthResponsePayload>(response);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        envelope.Should().NotBeNull();
        envelope!.Success.Should().BeTrue();
        envelope.Message.Should().Be(AppConstants.Auth.RegisterSuccess);
        envelope.Data.Should().NotBeNull();
        envelope.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        envelope.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Register_ShouldReturnConflict_WhenEmailAlreadyExists()
    {
        var request = new
        {
            Email = "duplicate@example.com",
            Password = "StrongP@ss1",
            ConfirmPassword = "StrongP@ss1"
        };

        _ = await _client.PostAsJsonAsync("/api/auth/register", request);
        using var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", request);
        var envelope = await ReadEnvelopeAsync<object>(secondResponse);

        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
        envelope.Should().NotBeNull();
        envelope!.Success.Should().BeFalse();
        envelope.Message.Should().Be(AppConstants.Auth.EmailAlreadyExists);
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid()
    {
        await RegisterUserAsync("login-invalid@example.com", "StrongP@ss1");

        using var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "login-invalid@example.com",
            Password = "WrongP@ss1"
        });
        var envelope = await ReadEnvelopeAsync<object>(response);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        envelope.Should().NotBeNull();
        envelope!.Success.Should().BeFalse();
        envelope.Message.Should().Be(AppConstants.Auth.InvalidCredentials);
    }

    [Fact]
    public async Task Login_ShouldRevokePreviousRefreshTokens_WhenCredentialsAreValid()
    {
        var register = await RegisterUserAsync("login-valid@example.com", "StrongP@ss1");

        using var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "login-valid@example.com",
            Password = "StrongP@ss1"
        });
        var login = await ReadEnvelopeAsync<AuthResponsePayload>(response);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        login!.Success.Should().BeTrue();

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tokensForUser = dbContext.RefreshTokens
            .Where(x => x.UserId == login.Data!.User.Id)
            .ToList();

        tokensForUser.Should().HaveCount(2);
        tokensForUser.Count(x => x.IsRevoked).Should().Be(1);
        tokensForUser.Count(x => !x.IsRevoked).Should().Be(1);
        tokensForUser.Any(x => x.Token == register.Data!.RefreshToken && x.IsRevoked).Should().BeTrue();
    }

    [Fact]
    public async Task RefreshToken_ShouldIssueNewTokensAndRevokeOldToken_WhenTokenIsValid()
    {
        var register = await RegisterUserAsync("refresh@example.com", "StrongP@ss1");
        var oldRefreshToken = register.Data!.RefreshToken;

        using var response = await _client.PostAsJsonAsync("/api/auth/refresh-token", new
        {
            RefreshToken = oldRefreshToken
        });
        var refresh = await ReadEnvelopeAsync<AuthResponsePayload>(response);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        refresh!.Success.Should().BeTrue();
        refresh.Data!.RefreshToken.Should().NotBe(oldRefreshToken);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var persistedOldToken = dbContext.RefreshTokens.First(x => x.Token == oldRefreshToken);
        var persistedNewToken = dbContext.RefreshTokens.First(x => x.Token == refresh.Data.RefreshToken);

        persistedOldToken.IsRevoked.Should().BeTrue();
        persistedNewToken.IsRevoked.Should().BeFalse();
    }

    [Fact]
    public async Task RefreshToken_ShouldReturnNotFound_WhenTokenDoesNotExist()
    {
        using var response = await _client.PostAsJsonAsync("/api/auth/refresh-token", new
        {
            RefreshToken = "missing-token"
        });
        var envelope = await ReadEnvelopeAsync<object>(response);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        envelope.Should().NotBeNull();
        envelope!.Success.Should().BeFalse();
        envelope.Message.Should().Be(AppConstants.Auth.TokenNotFound);
    }

    [Fact]
    public async Task RefreshToken_ShouldReturnUnauthorized_WhenTokenWasAlreadyRevoked()
    {
        var register = await RegisterUserAsync("refresh-revoked@example.com", "StrongP@ss1");
        var oldRefreshToken = register.Data!.RefreshToken;

        _ = await _client.PostAsJsonAsync("/api/auth/refresh-token", new { RefreshToken = oldRefreshToken });

        using var secondResponse = await _client.PostAsJsonAsync("/api/auth/refresh-token", new
        {
            RefreshToken = oldRefreshToken
        });
        var envelope = await ReadEnvelopeAsync<object>(secondResponse);

        secondResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        envelope.Should().NotBeNull();
        envelope!.Success.Should().BeFalse();
        envelope.Message.Should().Be(AppConstants.Auth.TokenRevoked);
    }

    [Fact]
    public async Task RevokeToken_ShouldRequireAuthorization_WhenBearerTokenIsMissing()
    {
        using var response = await _client.PostAsJsonAsync("/api/auth/revoke-token", new
        {
            RefreshToken = "token"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RevokeToken_ShouldReturnOkAndRevokeToken_WhenRequestIsValid()
    {
        const string email = "revoke@example.com";
        const string password = "StrongP@ss1";
        var register = await RegisterUserAsync(email, password);
        var login = await LoginUserAsync(email, password);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", login.Data!.AccessToken);

        using var response = await _client.PostAsJsonAsync("/api/auth/revoke-token", new
        {
            RefreshToken = login.Data.RefreshToken
        });
        var content = await response.Content.ReadAsStringAsync();
        var authHeader = string.Join(" | ", response.Headers.WwwAuthenticate.Select(x => x.ToString()));

        response.StatusCode.Should().Be(HttpStatusCode.OK, $"{content}; auth={authHeader}");
        var envelope = JsonSerializer.Deserialize<ApiEnvelope<object>>(content, JsonOptions);
        envelope!.Success.Should().BeTrue();
        envelope.Message.Should().Be(AppConstants.Auth.RevokeSuccess);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var token = dbContext.RefreshTokens.First(x => x.Token == login.Data.RefreshToken);
        token.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public async Task Me_ShouldReturnUnauthorized_WhenBearerTokenIsMissing()
    {
        using var response = await _client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_ShouldReturnAuthenticatedUser_WhenBearerTokenIsValid()
    {
        const string email = "me@example.com";
        const string password = "StrongP@ss1";
        _ = await RegisterUserAsync(email, password);
        var login = await LoginUserAsync(email, password);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", login.Data!.AccessToken);

        using var response = await _client.GetAsync("/api/auth/me");
        var content = await response.Content.ReadAsStringAsync();
        var authHeader = string.Join(" | ", response.Headers.WwwAuthenticate.Select(x => x.ToString()));

        response.StatusCode.Should().Be(HttpStatusCode.OK, $"{content}; auth={authHeader}");
        var envelope = JsonSerializer.Deserialize<ApiEnvelope<UserResponsePayload>>(content, JsonOptions);
        envelope.Should().NotBeNull();
        envelope!.Success.Should().BeTrue();
        envelope.Message.Should().Be(AppConstants.Auth.MeSuccess);
        envelope.Data.Should().NotBeNull();
        envelope.Data!.Email.Should().Be("me@example.com");
    }

    private async Task<ApiEnvelope<AuthResponsePayload>> RegisterUserAsync(string email, string password)
    {
        using var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = password,
            ConfirmPassword = password
        });

        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, content);
        var envelope = JsonSerializer.Deserialize<ApiEnvelope<AuthResponsePayload>>(content, JsonOptions);
        envelope.Should().NotBeNull();
        envelope!.Data.Should().NotBeNull();
        envelope.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        envelope.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        return envelope;
    }

    private async Task<ApiEnvelope<AuthResponsePayload>> LoginUserAsync(string email, string password)
    {
        using var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = password
        });

        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, content);
        var envelope = JsonSerializer.Deserialize<ApiEnvelope<AuthResponsePayload>>(content, JsonOptions);
        envelope.Should().NotBeNull();
        envelope!.Data.Should().NotBeNull();
        envelope.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        envelope.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        return envelope;
    }

    private static async Task<ApiEnvelope<TPayload>?> ReadEnvelopeAsync<TPayload>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        return JsonSerializer.Deserialize<ApiEnvelope<TPayload>>(content, JsonOptions);
    }

    private sealed record ApiEnvelope<TPayload>(
        bool Success,
        TPayload? Data,
        string Message,
        List<string> Errors);

    private sealed record AuthResponsePayload(
        string AccessToken,
        string RefreshToken,
        DateTime ExpiresAt,
        UserResponsePayload User);

    private sealed record UserResponsePayload(
        int Id,
        string Email,
        DateTime CreatedAt);
}
