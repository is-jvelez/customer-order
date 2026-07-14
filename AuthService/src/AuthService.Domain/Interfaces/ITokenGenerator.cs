using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

/// <summary>Contrato para generación de tokens de acceso y refresh.</summary>
public interface ITokenGenerator
{
    /// <summary>Genera un JWT firmado con los claims del usuario.</summary>
    string GenerateAccessToken(User user);

    /// <summary>
    /// Genera un refresh token aleatorio criptográfico.
    /// Retorna el valor del token y su fecha de expiración.
    /// </summary>
    (string Token, DateTime ExpiresAt) GenerateRefreshToken();
}
