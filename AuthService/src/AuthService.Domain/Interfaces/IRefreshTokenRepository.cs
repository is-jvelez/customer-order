using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

/// <summary>Contrato de persistencia para la entidad RefreshToken.</summary>
public interface IRefreshTokenRepository
{
    /// <summary>Obtiene un refresh token por su valor.</summary>
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>Agrega un nuevo refresh token al contexto de persistencia.</summary>
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);

    /// <summary>Revoca todos los refresh tokens activos de un usuario.</summary>
    Task RevokeAllForUserAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Persiste los cambios pendientes en el contexto.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
