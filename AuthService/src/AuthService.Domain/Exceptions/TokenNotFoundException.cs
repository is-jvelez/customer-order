namespace AuthService.Domain.Exceptions;

/// <summary>Se lanza cuando el refresh token proporcionado no existe en base de datos.</summary>
public class TokenNotFoundException : DomainException
{
    public TokenNotFoundException()
        : base("El refresh token no fue encontrado.") { }
}
