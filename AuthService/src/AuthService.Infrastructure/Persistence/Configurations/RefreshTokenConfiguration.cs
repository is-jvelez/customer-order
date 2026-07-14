using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Infrastructure.Persistence.Configurations;

/// <summary>Configuración Fluent API de la entidad RefreshToken. EF Core creará esta tabla via migration.</summary>
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).UseIdentityColumn();

        builder.Property(r => r.Token)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(r => r.ExpiresAt).IsRequired();
        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.RevokedAt).IsRequired(false);

        builder.Property(r => r.IsRevoked)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_RefreshTokens_Users");
    }
}
