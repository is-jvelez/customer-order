<?php

namespace App\Infrastructure\Security;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;

class JwtVerifier
{
    private readonly string $secret;
    private readonly string $issuer;
    private readonly string $audience;

    public function __construct()
    {
        $this->secret   = (string) config('services.jwt.secret');
        $this->issuer   = (string) config('services.jwt.issuer');
        $this->audience = (string) config('services.jwt.audience');
    }

    /**
     * Verifica la firma, expiración, issuer y audience del token.
     *
     * @throws RuntimeException si el token es inválido o expirado
     */
    public function verify(string $token): object
    {
        $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));

        if (!isset($decoded->sub, $decoded->email, $decoded->iat, $decoded->exp)) {
            throw new RuntimeException('Token sin claims requeridos (sub, email, iat, exp).');
        }

        if ($decoded->iss !== $this->issuer) {
            throw new RuntimeException("Issuer inválido: '{$decoded->iss}'.");
        }

        $aud = is_array($decoded->aud) ? $decoded->aud[0] : $decoded->aud;
        if ($aud !== $this->audience) {
            throw new RuntimeException("Audience inválida: '{$aud}'.");
        }

        return $decoded;
    }
}
