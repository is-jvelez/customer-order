using AuthService.Application.Interfaces;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.DependencyInjection;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.UnitTest.Infrastructure.DependencyInjection;

public class InfrastructureServiceExtensionsTests
{
    [Fact]
    public void AddInfrastructure_ShouldRegisterExpectedDependencies_WhenConfigurationIsValid()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Server=(localdb)\\mssqllocaldb;Database=AuthServiceTest;Trusted_Connection=True;TrustServerCertificate=True;"
            })
            .Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);

        services.AddInfrastructure(configuration);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        scope.ServiceProvider.GetService<IUserRepository>().Should().NotBeNull();
        scope.ServiceProvider.GetService<IRefreshTokenRepository>().Should().NotBeNull();
        scope.ServiceProvider.GetService<IPasswordHasher>().Should().NotBeNull();
        scope.ServiceProvider.GetService<ITokenGenerator>().Should().NotBeNull();
        scope.ServiceProvider.GetService<IAuthService>().Should().NotBeNull();
    }
}
