namespace AuthService.Domain.Exceptions;

/// <summary>Excepción base para todas las excepciones del dominio.</summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}
