using AuthService.Domain.Exceptions;
using FluentAssertions;

namespace AuthService.UnitTest.Domain.Exceptions;

public class DomainExceptionsTests
{
    [Fact]
    public void UserAlreadyExistsException_ShouldContainProvidedEmail_WhenThrown()
    {
        var exception = new UserAlreadyExistsException("user@example.com");

        exception.Should().BeAssignableTo<DomainException>();
        exception.Message.Should().Contain("user@example.com");
    }

    [Fact]
    public void InvalidCredentialsException_ShouldReturnExpectedMessage_WhenThrown()
    {
        var exception = new InvalidCredentialsException();

        exception.Should().BeAssignableTo<DomainException>();
        exception.Message.Should().Contain("Credenciales");
    }

    [Fact]
    public void TokenNotFoundException_ShouldReturnExpectedMessage_WhenThrown()
    {
        var exception = new TokenNotFoundException();

        exception.Should().BeAssignableTo<DomainException>();
        exception.Message.Should().Contain("no fue encontrado");
    }

    [Fact]
    public void TokenRevokedException_ShouldReturnExpectedMessage_WhenThrown()
    {
        var exception = new TokenRevokedException();

        exception.Should().BeAssignableTo<DomainException>();
        exception.Message.Should().Contain("revocado");
    }
}
