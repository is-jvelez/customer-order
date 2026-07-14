namespace AuthService.Domain.Exceptions;

/// <summary>Se lanza cuando se intenta usar un refresh token que ya fue revocado o expiró.</summary>
public class TokenRevokedException : DomainException
{
    public TokenRevokedException()
        : base("El refresh token ya fue revocado o ha expirado.") { }
}
