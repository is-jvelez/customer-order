namespace AuthService.Domain.Exceptions;

/// <summary>Se lanza cuando se intenta registrar un email que ya existe en el sistema.</summary>
public class UserAlreadyExistsException : DomainException
{
    public UserAlreadyExistsException(string email)
        : base($"Ya existe un usuario con el email '{email}'.") { }
}
