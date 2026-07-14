using AuthService.Application.DTOs.Request;
using AuthService.Application.Validators;
using FluentAssertions;

namespace AuthService.UnitTest.Application.Validators;

public class LoginRequestValidatorTests
{
    private readonly LoginRequestValidator _validator = new();

    [Fact]
    public void Validate_ShouldHaveValidationErrors_WhenEmailOrPasswordIsInvalid()
    {
        var request = new LoginRequest("", "");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(LoginRequest.Email));
        result.Errors.Should().Contain(x => x.PropertyName == nameof(LoginRequest.Password));
    }

    [Fact]
    public void Validate_ShouldNotHaveValidationErrors_WhenRequestIsValid()
    {
        var request = new LoginRequest("user@example.com", "Passw0rd!");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
