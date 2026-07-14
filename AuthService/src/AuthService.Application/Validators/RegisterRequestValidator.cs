using AuthService.Application.DTOs.Request;
using FluentValidation;

namespace AuthService.Application.Validators;

/// <summary>Validador para el request de registro de usuario.</summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El email es requerido.")
            .EmailAddress().WithMessage("El email no tiene un formato válido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña es requerida.")
            .MinimumLength(8).WithMessage("La contraseña debe tener al menos 8 caracteres.")
            .Matches(@"[A-Z]").WithMessage("La contraseña debe contener al menos una letra mayúscula.")
            .Matches(@"[0-9]").WithMessage("La contraseña debe contener al menos un número.")
            .Matches(@"[!@#$%^&*]").WithMessage("La contraseña debe contener al menos un carácter especial (!@#$%^&*).");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("La confirmación de contraseña es requerida.")
            .Equal(x => x.Password).WithMessage("Las contraseñas no coinciden.");
    }
}
