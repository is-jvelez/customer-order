using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Persistence.Repositories;

/// <summary>Repositorio EF Core para la entidad RefreshToken.</summary>
public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _context;

    public RefreshTokenRepository(AppDbContext context) => _context = context;

    /// <summary>Obtiene un refresh token por su valor string.</summary>
    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default) =>
        await _context.RefreshTokens.FirstOrDefaultAsync(r => r.Token == token, cancellationToken);

    /// <summary>Agrega un refresh token al contexto sin persistir todavía.</summary>
    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default) =>
        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);

    /// <summary>
    /// Revoca todos los refresh tokens activos del usuario mediante UPDATE masivo,
    /// sin cargar entidades en memoria.
    /// </summary>
    public async Task RevokeAllForUserAsync(int userId, CancellationToken cancellationToken = default) =>
        await _context.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.IsRevoked, true)
                .SetProperty(r => r.RevokedAt, DateTime.UtcNow),
            cancellationToken);

    /// <summary>Persiste todos los cambios pendientes en el contexto.</summary>
    public async Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await _context.SaveChangesAsync(cancellationToken);
}
