using AuthService.Application.DTOs.Request;
using FluentValidation;

namespace AuthService.Application.Validators;

/// <summary>Validador para el request de renovación de token.</summary>
public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("El refresh token es requerido.");
    }
}
