using AuthService.Domain.Entities;
using FluentAssertions;

namespace AuthService.UnitTest.Domain.Entities;

public class UserTests
{
    [Fact]
    public void Create_ShouldInitializeProperties_WhenArgumentsAreValid()
    {
        var before = DateTime.UtcNow;

        var user = User.Create("test@example.com", "hashed");

        var after = DateTime.UtcNow;

        user.Email.Should().Be("test@example.com");
        user.PasswordHash.Should().Be("hashed");
        user.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }
}
