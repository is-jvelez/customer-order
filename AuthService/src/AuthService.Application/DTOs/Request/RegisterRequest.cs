namespace AuthService.Application.DTOs.Request;

/// <summary>Datos requeridos para registrar un nuevo usuario.</summary>
public record RegisterRequest(string Email, string Password, string ConfirmPassword);
