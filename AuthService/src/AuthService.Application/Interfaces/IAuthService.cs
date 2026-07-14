using AuthService.Application.DTOs.Request;
using AuthService.Application.DTOs.Response;

namespace AuthService.Application.Interfaces;

/// <summary>Contrato del servicio de autenticación.</summary>
public interface IAuthService
{
    /// <summary>Registra un nuevo usuario y retorna tokens de acceso.</summary>
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    /// <summary>Autentica un usuario y retorna tokens de acceso, revocando los refresh tokens previos.</summary>
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    /// <summary>Renueva el access token usando un refresh token válido.</summary>
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    /// <summary>Revoca un refresh token activo.</summary>
    Task RevokeTokenAsync(RevokeTokenRequest request, CancellationToken cancellationToken = default);

    /// <summary>Obtiene los datos del usuario autenticado por su ID.</summary>
    Task<UserResponse> GetAuthenticatedUserAsync(int userId, CancellationToken cancellationToken = default);
}
