using System.Text.RegularExpressions;

namespace AuthService.Domain.ValueObjects;

/// <summary>Value object que encapsula y valida una dirección de correo electrónico.</summary>
public sealed class Email
{
    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public string Value { get; }

    private Email(string value) => Value = value;

    /// <summary>Crea un Email validado. Lanza ArgumentException si el formato es inválido.</summary>
    public static Email Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("El email no puede estar vacío.");

        if (!EmailRegex.IsMatch(value))
            throw new ArgumentException($"'{value}' no es una dirección de email válida.");

        return new Email(value.ToLowerInvariant());
    }

    public override string ToString() => Value;
    public override bool Equals(object? obj) => obj is Email other && Value == other.Value;
    public override int GetHashCode() => Value.GetHashCode();
}
