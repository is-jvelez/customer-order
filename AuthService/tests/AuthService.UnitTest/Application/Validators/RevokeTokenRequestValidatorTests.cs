using AuthService.Application.DTOs.Request;
using AuthService.Application.Validators;
using FluentAssertions;

namespace AuthService.UnitTest.Application.Validators;

public class RevokeTokenRequestValidatorTests
{
    private readonly RevokeTokenRequestValidator _validator = new();

    [Fact]
    public void Validate_ShouldHaveValidationError_WhenRefreshTokenIsEmpty()
    {
        var request = new RevokeTokenRequest("");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RevokeTokenRequest.RefreshToken));
    }

    [Fact]
    public void Validate_ShouldNotHaveValidationErrors_WhenRefreshTokenIsProvided()
    {
        var request = new RevokeTokenRequest("token-value");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
