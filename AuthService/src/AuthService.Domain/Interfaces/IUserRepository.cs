using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

/// <summary>Contrato de persistencia para la entidad User.</summary>
public interface IUserRepository
{
    /// <summary>Obtiene un usuario por su dirección de email.</summary>
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Obtiene un usuario por su identificador.</summary>
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Persiste un nuevo usuario y guarda los cambios.</summary>
    Task AddAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>Indica si ya existe un usuario con el email dado.</summary>
    Task<bool> ExistsAsync(string email, CancellationToken cancellationToken = default);
}
