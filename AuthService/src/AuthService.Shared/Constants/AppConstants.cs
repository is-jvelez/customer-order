namespace AuthService.Shared.Constants;

/// <summary>Constantes de aplicación agrupadas por dominio funcional.</summary>
public static class AppConstants
{
    public static class Cors
    {
        public const string PolicyName = "AllowFrontend";
    }

    public static class Auth
    {
        public const string LoginSuccess = "Login exitoso";
        public const string RegisterSuccess = "Usuario registrado exitosamente";
        public const string RefreshSuccess = "Token renovado exitosamente";
        public const string RevokeSuccess = "Token revocado exitosamente";
        public const string MeSuccess = "Usuario autenticado";
        public const string InvalidCredentials = "Credenciales inválidas";
        public const string EmailAlreadyExists = "El correo ya está registrado";
        public const string TokenNotFound = "Token no encontrado";
        public const string TokenRevoked = "El token ya fue revocado";
        public const string ValidationFailed = "Datos inválidos";
    }
}
