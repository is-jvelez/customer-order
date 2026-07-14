using AuthService.Application.Mappings;
using AuthService.UnitTest.TestCommon;
using FluentAssertions;

namespace AuthService.UnitTest.Application.Mappings;

public class UserMappingsTests
{
    [Fact]
    public void ToUserResponse_ShouldMapAllProperties_WhenUserIsValid()
    {
        var user = DomainEntityFactory.CreateUser(
            id: 99,
            email: "mapped@example.com",
            passwordHash: "ignored");

        var result = user.ToUserResponse();

        result.Id.Should().Be(99);
        result.Email.Should().Be("mapped@example.com");
        result.CreatedAt.Should().Be(user.CreatedAt);
    }
}
