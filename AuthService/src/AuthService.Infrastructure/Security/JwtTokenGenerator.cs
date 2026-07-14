using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using AppJwtConstants = AuthService.Shared.Constants.JwtConstants;

namespace AuthService.Infrastructure.Security;

/// <summary>Generador de JWT y refresh tokens usando System.IdentityModel.Tokens.Jwt.</summary>
public class JwtTokenGenerator : ITokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration) => _configuration = configuration;

    /// <summary>Genera un JWT firmado con los claims sub, email, iat y exp.</summary>
    public string GenerateAccessToken(User user)
    {
        var secret = _configuration[AppJwtConstants.SecretKey]!;
        var issuer = _configuration[AppJwtConstants.IssuerKey];
        var audience = _configuration[AppJwtConstants.AudienceKey];
        var expirationMinutes = int.Parse(_configuration[AppJwtConstants.AccessTokenExpirationKey]!);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(AppJwtConstants.ClaimSub, user.Id.ToString()),
            new(AppJwtConstants.ClaimEmail, user.Email),
            new(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Genera un refresh token aleatorio criptográfico usando RandomNumberGenerator.
    /// Retorna el valor del token y su fecha de expiración calculada desde configuración.
    /// </summary>
    public (string Token, DateTime ExpiresAt) GenerateRefreshToken()
    {
        var expirationDays = int.Parse(_configuration[AppJwtConstants.RefreshTokenExpirationKey]!);
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var expiresAt = DateTime.UtcNow.AddDays(expirationDays);
        return (token, expiresAt);
    }
}
