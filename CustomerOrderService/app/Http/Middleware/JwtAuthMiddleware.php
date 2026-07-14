<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiResponse;
use App\Infrastructure\Security\JwtVerifier;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthMiddleware
{
    public function __construct(
        private readonly JwtVerifier $verifier,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization', '');

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return ApiResponse::error('Token no proporcionado.', [], 401);
        }

        $token = substr($authHeader, 7);

        try {
            $payload = $this->verifier->verify($token);
            $request->merge([
                'auth_user_id' => $payload->sub,
                'auth_email'   => $payload->email,
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::error('Token inválido o expirado.', [$e->getMessage()], 401);
        }

        return $next($request);
    }
}
