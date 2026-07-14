<?php

namespace Tests\Support;

use App\Infrastructure\Security\JwtVerifier;
use Mockery\MockInterface;

trait AuthenticatesWithJwt
{
    protected function authenticateWithJwt(int $userId = 1, string $email = 'tester@example.com'): void
    {
        $this->mock(JwtVerifier::class, function (MockInterface $mock) use ($userId, $email): void {
            $mock->shouldReceive('verify')
                ->andReturn((object) [
                    'sub' => $userId,
                    'email' => $email,
                    'iat' => time() - 60,
                    'exp' => time() + 3600,
                    'iss' => 'test-issuer',
                    'aud' => 'test-audience',
                ]);
        });
    }

    protected function authenticateWithInvalidJwt(string $reason = 'Token invalido.'): void
    {
        $this->mock(JwtVerifier::class, function (MockInterface $mock) use ($reason): void {
            $mock->shouldReceive('verify')
                ->andThrow(new \RuntimeException($reason));
        });
    }

    /** @return array<string, string> */
    protected function apiHeaders(string $token = 'valid-token'): array
    {
        return [
            'Accept' => 'application/json',
            'Authorization' => "Bearer {$token}",
        ];
    }
}

