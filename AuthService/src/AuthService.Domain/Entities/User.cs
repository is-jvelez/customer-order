namespace AuthService.Domain.Entities;

/// <summary>Entidad de dominio que representa un usuario del sistema.</summary>
public class User
{
    public int Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private User() { }

    /// <summary>Crea una nueva instancia de User con email y hash de contraseña.</summary>
    public static User Create(string email, string passwordHash) =>
        new()
        {
            Email = email,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };
}
