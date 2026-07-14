using AuthService.Application.DTOs.Request;
using FluentValidation;

namespace AuthService.Application.Validators;

/// <summary>Validador para el request de revocación de token.</summary>
public class RevokeTokenRequestValidator : AbstractValidator<RevokeTokenRequest>
{
    public RevokeTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("El refresh token es requerido.");
    }
}
