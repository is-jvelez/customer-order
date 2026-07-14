using AuthService.Application.DTOs.Response;
using AuthService.Domain.Entities;

namespace AuthService.Application.Mappings;

/// <summary>Mappings manuales de la entidad User hacia DTOs de respuesta.</summary>
public static class UserMappings
{
    /// <summary>Convierte un User de dominio a UserResponse DTO.</summary>
    public static UserResponse ToUserResponse(this User user) =>
        new(user.Id, user.Email, user.CreatedAt);
}
