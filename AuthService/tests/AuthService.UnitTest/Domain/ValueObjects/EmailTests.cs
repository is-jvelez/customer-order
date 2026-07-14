using AuthService.Domain.ValueObjects;
using FluentAssertions;

namespace AuthService.UnitTest.Domain.ValueObjects;

public class EmailTests
{
    [Fact]
    public void Create_ShouldReturnLowercaseEmail_WhenValueIsValid()
    {
        var result = Email.Create("User.Name@Example.com");

        result.Value.Should().Be("user.name@example.com");
    }

    [Fact]
    public void Create_ShouldThrowArgumentException_WhenValueIsEmpty()
    {
        var act = () => Email.Create(" ");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*no puede estar vac*");
    }

    [Fact]
    public void Create_ShouldThrowArgumentException_WhenValueHasInvalidFormat()
    {
        var act = () => Email.Create("not-an-email");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*no es una direcci*n de email v*lida*");
    }

    [Fact]
    public void Equals_ShouldReturnTrue_WhenEmailsAreEquivalentIgnoringCaseInput()
    {
        var left = Email.Create("TEST@EXAMPLE.COM");
        var right = Email.Create("test@example.com");

        left.Equals(right).Should().BeTrue();
        left.GetHashCode().Should().Be(right.GetHashCode());
    }
}
