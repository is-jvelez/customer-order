namespace AuthService.Application.DTOs.Response;

/// <summary>Datos públicos del usuario devueltos en las respuestas.</summary>
public record UserResponse(int Id, string Email, DateTime CreatedAt);
