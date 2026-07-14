using AuthService.Domain.Entities;
using FluentAssertions;

namespace AuthService.UnitTest.Domain.Entities;

public class RefreshTokenTests
{
    [Fact]
    public void Create_ShouldInitializeActiveToken_WhenArgumentsAreValid()
    {
        var expiresAt = DateTime.UtcNow.AddDays(7);

        var token = RefreshToken.Create(23, "refresh-123", expiresAt);

        token.UserId.Should().Be(23);
        token.Token.Should().Be("refresh-123");
        token.ExpiresAt.Should().Be(expiresAt);
        token.IsRevoked.Should().BeFalse();
        token.RevokedAt.Should().BeNull();
    }

    [Fact]
    public void Revoke_ShouldSetRevokedFlags_WhenTokenWasActive()
    {
        var token = RefreshToken.Create(7, "refresh-456", DateTime.UtcNow.AddDays(2));
        var before = DateTime.UtcNow;

        token.Revoke();

        var after = DateTime.UtcNow;
        token.IsRevoked.Should().BeTrue();
        token.RevokedAt.Should().NotBeNull();
        token.RevokedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }
}
