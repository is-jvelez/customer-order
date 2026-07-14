using System.IdentityModel.Tokens.Jwt;
using AuthService.Infrastructure.Security;
using AuthService.UnitTest.TestCommon;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using AppJwtConstants = AuthService.Shared.Constants.JwtConstants;

namespace AuthService.UnitTest.Infrastructure.Security;

public class JwtTokenGeneratorTests
{
    private static readonly IConfiguration Configuration = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            [AppJwtConstants.SecretKey] = "MyUltraSecretKeyForJwtUnitTestsOnly_123456789",
            [AppJwtConstants.IssuerKey] = "AuthService",
            [AppJwtConstants.AudienceKey] = "OrderFlowApp",
            [AppJwtConstants.AccessTokenExpirationKey] = "60",
            [AppJwtConstants.RefreshTokenExpirationKey] = "7"
        })
        .Build();

    [Fact]
    public void GenerateAccessToken_ShouldContainExpectedClaims_WhenUserIsValid()
    {
        var generator = new JwtTokenGenerator(Configuration);
        var user = DomainEntityFactory.CreateUser(id: 42, email: "claims@example.com");

        var token = generator.GenerateAccessToken(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.First(x => x.Type == AppJwtConstants.ClaimSub).Value.Should().Be("42");
        jwt.Claims.First(x => x.Type == AppJwtConstants.ClaimEmail).Value.Should().Be("claims@example.com");
        jwt.ValidTo.Should().BeAfter(DateTime.UtcNow.AddMinutes(59));
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnUniqueTokenAndFutureExpiration_WhenCalledMultipleTimes()
    {
        var generator = new JwtTokenGenerator(Configuration);
        var before = DateTime.UtcNow;

        var first = generator.GenerateRefreshToken();
        var second = generator.GenerateRefreshToken();

        first.Token.Should().NotBeNullOrWhiteSpace();
        second.Token.Should().NotBeNullOrWhiteSpace();
        first.Token.Should().NotBe(second.Token);
        first.ExpiresAt.Should().BeAfter(before.AddDays(6));
        second.ExpiresAt.Should().BeAfter(before.AddDays(6));
    }
}
