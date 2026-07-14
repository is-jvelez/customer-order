namespace AuthService.Domain.Interfaces;

/// <summary>Contrato para hashing y verificación de contraseñas.</summary>
public interface IPasswordHasher
{
    /// <summary>Genera el hash de una contraseña en texto plano.</summary>
    string Hash(string password);

    /// <summary>Verifica que una contraseña en texto plano corresponda a un hash almacenado.</summary>
    bool Verify(string password, string hash);
}
