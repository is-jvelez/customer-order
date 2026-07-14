using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Persistence.Repositories;

/// <summary>Repositorio EF Core para la entidad User.</summary>
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context) => _context = context;

    /// <summary>Obtiene un usuario por email (búsqueda case-insensitive a nivel de base de datos).</summary>
    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    /// <summary>Obtiene un usuario por su ID primario.</summary>
    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _context.Users.FindAsync([id], cancellationToken);

    /// <summary>Persiste un nuevo usuario y guarda los cambios para obtener el ID generado.</summary>
    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Verifica si existe un usuario con el email dado.</summary>
    public async Task<bool> ExistsAsync(string email, CancellationToken cancellationToken = default) =>
        await _context.Users.AnyAsync(u => u.Email == email, cancellationToken);
}
