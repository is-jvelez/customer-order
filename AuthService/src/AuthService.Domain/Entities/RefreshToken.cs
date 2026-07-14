namespace AuthService.Domain.Entities;

/// <summary>Entidad de dominio que representa un refresh token almacenado en base de datos.</summary>
public class RefreshToken
{
    public int Id { get; private set; }
    public int UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public bool IsRevoked { get; private set; }

    private RefreshToken() { }

    /// <summary>Crea un nuevo refresh token para el usuario dado.</summary>
    public static RefreshToken Create(int userId, string token, DateTime expiresAt) =>
        new()
        {
            UserId = userId,
            Token = token,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

    /// <summary>Marca el token como revocado.</summary>
    public void Revoke()
    {
        IsRevoked = true;
        RevokedAt = DateTime.UtcNow;
    }
}
