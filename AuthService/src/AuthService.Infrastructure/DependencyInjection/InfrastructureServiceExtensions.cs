using AuthService.Application.Interfaces;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.Persistence.Context;
using AuthService.Infrastructure.Persistence.Repositories;
using AuthService.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AppAuthService = AuthService.Application.Services.AuthService;

namespace AuthService.Infrastructure.DependencyInjection;

/// <summary>Extensiones de IServiceCollection para registrar todos los servicios de Infrastructure.</summary>
public static class InfrastructureServiceExtensions
{
    /// <summary>Registra DbContext, repositorios, seguridad y el servicio de autenticación en el contenedor DI.</summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ITokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AppAuthService>();

        return services;
    }
}
