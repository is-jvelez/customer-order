namespace AuthService.Shared.Wrappers;

/// <summary>Envelope estándar para todas las respuestas de la API.</summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string Message { get; init; } = string.Empty;
    public IEnumerable<string> Errors { get; init; } = [];

    /// <summary>Crea una respuesta de éxito con datos.</summary>
    public static ApiResponse<T> Ok(T data, string message) =>
        new() { Success = true, Data = data, Message = message, Errors = [] };

    /// <summary>Crea una respuesta de error con mensaje y lista de errores opcional.</summary>
    public static ApiResponse<T> Fail(string message, IEnumerable<string>? errors = null) =>
        new() { Success = false, Data = default, Message = message, Errors = errors ?? [] };
}
