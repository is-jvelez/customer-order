using AuthService.Infrastructure.Security;
using FluentAssertions;

namespace AuthService.UnitTest.Infrastructure.Security;

public class BcryptPasswordHasherTests
{
    [Fact]
    public void Hash_ShouldReturnDifferentValueThanInput_WhenPasswordIsProvided()
    {
        var hasher = new BcryptPasswordHasher();

        var hash = hasher.Hash("StrongP@ss1");

        hash.Should().NotBeNullOrWhiteSpace();
        hash.Should().NotBe("StrongP@ss1");
    }

    [Fact]
    public void Verify_ShouldReturnTrueForCorrectPasswordAndFalseForWrongPassword_WhenHashWasGenerated()
    {
        var hasher = new BcryptPasswordHasher();
        var hash = hasher.Hash("StrongP@ss1");

        hasher.Verify("StrongP@ss1", hash).Should().BeTrue();
        hasher.Verify("WrongP@ss1", hash).Should().BeFalse();
    }
}
