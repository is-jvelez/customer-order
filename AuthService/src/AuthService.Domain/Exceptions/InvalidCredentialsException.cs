namespace AuthService.Domain.Exceptions;

/// <summary>Se lanza cuando las credenciales de autenticación son incorrectas.</summary>
public class InvalidCredentialsException : DomainException
{
    public InvalidCredentialsException()
        : base("Credenciales inválidas.") { }
}
