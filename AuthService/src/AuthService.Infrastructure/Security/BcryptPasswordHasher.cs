using AuthService.Domain.Interfaces;

namespace AuthService.Infrastructure.Security;

/// <summary>Implementación de hashing de contraseñas usando BCrypt con work factor 11.</summary>
public class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 11;

    /// <summary>Genera el hash BCrypt de la contraseña.</summary>
    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    /// <summary>Verifica que la contraseña en texto plano coincida con el hash almacenado.</summary>
    public bool Verify(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
