namespace AuthService.Application.DTOs.Request;

/// <summary>Credenciales para iniciar sesión.</summary>
public record LoginRequest(string Email, string Password);
