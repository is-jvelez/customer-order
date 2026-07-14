namespace AuthService.Shared.Constants;

/// <summary>Claves de configuración y nombres de claims JWT.</summary>
public static class JwtConstants
{
    public const string ClaimSub = "sub";
    public const string ClaimEmail = "email";

    public const string SecretKey = "JwtSettings:Secret";
    public const string IssuerKey = "JwtSettings:Issuer";
    public const string AudienceKey = "JwtSettings:Audience";
    public const string AccessTokenExpirationKey = "JwtSettings:AccessTokenExpirationMinutes";
    public const string RefreshTokenExpirationKey = "JwtSettings:RefreshTokenExpirationDays";
}
