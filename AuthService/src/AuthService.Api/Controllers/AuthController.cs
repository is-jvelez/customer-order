using AuthService.Application.DTOs.Request;
using AuthService.Application.DTOs.Response;
using AuthService.Application.Interfaces;
using AuthService.Shared.Constants;
using AuthService.Shared.Wrappers;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

/// <summary>Controlador de autenticación. Expone los 5 endpoints del microservicio.</summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RefreshTokenRequest> _refreshValidator;
    private readonly IValidator<RevokeTokenRequest> _revokeValidator;

    public AuthController(
        IAuthService authService,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<RefreshTokenRequest> refreshValidator,
        IValidator<RevokeTokenRequest> revokeValidator)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _refreshValidator = refreshValidator;
        _revokeValidator = revokeValidator;
    }

    /// <summary>Registra un nuevo usuario. Retorna 201 con tokens o 409 si el email ya existe.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var validation = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail(
                AppConstants.Auth.ValidationFailed,
                validation.Errors.Select(e => e.ErrorMessage)));

        var result = await _authService.RegisterAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<AuthResponse>.Ok(result, AppConstants.Auth.RegisterSuccess));
    }

    /// <summary>Autentica un usuario. Retorna 200 con tokens o 401 si las credenciales son incorrectas.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var validation = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail(
                AppConstants.Auth.ValidationFailed,
                validation.Errors.Select(e => e.ErrorMessage)));

        var result = await _authService.LoginAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Ok(result, AppConstants.Auth.LoginSuccess));
    }

    /// <summary>Renueva el access token con un refresh token válido.</summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var validation = await _refreshValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail(
                AppConstants.Auth.ValidationFailed,
                validation.Errors.Select(e => e.ErrorMessage)));

        var result = await _authService.RefreshTokenAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Ok(result, AppConstants.Auth.RefreshSuccess));
    }

    /// <summary>Revoca un refresh token activo. Requiere JWT válido.</summary>
    [HttpPost("revoke-token")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request, CancellationToken cancellationToken)
    {
        var validation = await _revokeValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail(
                AppConstants.Auth.ValidationFailed,
                validation.Errors.Select(e => e.ErrorMessage)));

        await _authService.RevokeTokenAsync(request, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, AppConstants.Auth.RevokeSuccess));
    }

    /// <summary>Retorna los datos del usuario autenticado. Requiere JWT válido.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(JwtConstants.ClaimSub)?.Value;
        var userId = int.Parse(userIdClaim!);

        var result = await _authService.GetAuthenticatedUserAsync(userId, cancellationToken);
        return Ok(ApiResponse<UserResponse>.Ok(result, AppConstants.Auth.MeSuccess));
    }
}
