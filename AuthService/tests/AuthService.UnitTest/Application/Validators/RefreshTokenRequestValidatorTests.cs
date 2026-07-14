using AuthService.Application.DTOs.Request;
using AuthService.Application.Validators;
using FluentAssertions;

namespace AuthService.UnitTest.Application.Validators;

public class RefreshTokenRequestValidatorTests
{
    private readonly RefreshTokenRequestValidator _validator = new();

    [Fact]
    public void Validate_ShouldHaveValidationError_WhenRefreshTokenIsEmpty()
    {
        var request = new RefreshTokenRequest("");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RefreshTokenRequest.RefreshToken));
    }

    [Fact]
    public void Validate_ShouldNotHaveValidationErrors_WhenRefreshTokenIsProvided()
    {
        var request = new RefreshTokenRequest("token-value");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
