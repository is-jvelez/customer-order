using System.Net;
using System.Text.Json;
using AuthService.Domain.Exceptions;
using AuthService.Shared.Constants;
using AuthService.Shared.Wrappers;

namespace AuthService.Api.Middleware;

/// <summary>
/// Middleware que captura todas las excepciones de dominio y las transforma
/// en respuestas ApiResponse con el HTTP status correcto.
/// Debe ser el primero en el pipeline para cubrir todos los endpoints.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>Invoca el siguiente middleware y captura excepciones de dominio.</summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UserAlreadyExistsException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.Conflict,
                AppConstants.Auth.EmailAlreadyExists, ex.Message);
        }
        catch (InvalidCredentialsException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.Unauthorized,
                AppConstants.Auth.InvalidCredentials, ex.Message);
        }
        catch (TokenNotFoundException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.NotFound,
                AppConstants.Auth.TokenNotFound, ex.Message);
        }
        catch (TokenRevokedException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.Unauthorized,
                AppConstants.Auth.TokenRevoked, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción no controlada");
            await WriteErrorResponse(context, HttpStatusCode.InternalServerError,
                "Ocurrió un error inesperado.", ex.Message);
        }
    }

    private static async Task WriteErrorResponse(
        HttpContext context,
        HttpStatusCode statusCode,
        string message,
        string detail)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = ApiResponse<object>.Fail(message, [detail]);
        var json = JsonSerializer.Serialize(response, JsonOptions);

        await context.Response.WriteAsync(json);
    }
}
