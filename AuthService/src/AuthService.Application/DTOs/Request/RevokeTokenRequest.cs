namespace AuthService.Application.DTOs.Request;

/// <summary>Token de refresco a invalidar.</summary>
public record RevokeTokenRequest(string RefreshToken);
