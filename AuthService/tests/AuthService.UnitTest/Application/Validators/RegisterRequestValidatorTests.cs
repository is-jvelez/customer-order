using AuthService.Application.DTOs.Request;
using AuthService.Application.Validators;
using FluentAssertions;

namespace AuthService.UnitTest.Application.Validators;

public class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    [Fact]
    public void Validate_ShouldHaveValidationErrors_WhenPasswordDoesNotMeetPolicy()
    {
        var request = new RegisterRequest(
            "user@example.com",
            "weak",
            "weak");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void Validate_ShouldHaveValidationErrors_WhenPasswordsDoNotMatch()
    {
        var request = new RegisterRequest(
            "user@example.com",
            "StrongP@ss1",
            "StrongP@ss2");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RegisterRequest.ConfirmPassword));
    }

    [Fact]
    public void Validate_ShouldNotHaveValidationErrors_WhenRequestIsValid()
    {
        var request = new RegisterRequest(
            "user@example.com",
            "StrongP@ss1",
            "StrongP@ss1");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
