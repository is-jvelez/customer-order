using AuthService.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Testcontainers.MsSql;

namespace AuthService.IntegrationTest;

public sealed class AuthApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string JwtSecret = "IntegrationSecretKey_AuthService_123456789!";
    private const string JwtIssuer = "AuthService";
    private const string JwtAudience = "OrderFlowApp";

    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    private string _connectionString = string.Empty;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _connectionString,
                ["JwtSettings:Secret"] = JwtSecret,
                ["JwtSettings:Issuer"] = JwtIssuer,
                ["JwtSettings:Audience"] = JwtAudience,
                ["JwtSettings:AccessTokenExpirationMinutes"] = "60",
                ["JwtSettings:RefreshTokenExpirationDays"] = "7",
                ["AllowedOrigins:0"] = "http://localhost:4200"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(_connectionString));

            services.PostConfigure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme,
                options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret)),
                        ValidateIssuer = true,
                        ValidIssuer = JwtIssuer,
                        ValidateAudience = true,
                        ValidAudience = JwtAudience,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };
                });
        });
    }

    public async Task InitializeAsync()
    {
        await _msSqlContainer.StartAsync();
        var builder = new SqlConnectionStringBuilder(_msSqlContainer.GetConnectionString())
        {
            InitialCatalog = "AuthServiceIntegrationTests"
        };
        _connectionString = builder.ConnectionString;
        _ = CreateClient();
        await ResetDatabaseAsync();
    }

    public new async Task DisposeAsync()
    {
        await _msSqlContainer.DisposeAsync();
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [RefreshTokens]; DELETE FROM [Users];");
    }
}
