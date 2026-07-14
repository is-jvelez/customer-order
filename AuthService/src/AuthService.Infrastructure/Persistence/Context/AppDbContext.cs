using AuthService.Domain.Entities;
using AuthService.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Persistence.Context;

/// <summary>Contexto de base de datos principal de la aplicación.</summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
    }
}
