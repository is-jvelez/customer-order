namespace AuthService.Application.DTOs.Response;

/// <summary>Respuesta de autenticación con tokens y datos del usuario.</summary>
public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserResponse User);
