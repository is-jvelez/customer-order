namespace AuthService.Application.DTOs.Request;

/// <summary>Token de refresco para solicitar un nuevo access token.</summary>
public record RefreshTokenRequest(string RefreshToken);
