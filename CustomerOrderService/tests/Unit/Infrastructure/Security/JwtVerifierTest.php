<?php

namespace Tests\Unit\Infrastructure\Security;

use App\Infrastructure\Security\JwtVerifier;
use Firebase\JWT\JWT;
use RuntimeException;
use Tests\TestCase;

class JwtVerifierTest extends TestCase
{
    private const TEST_SECRET = 'MySuperSecretKeyForDevelopmentOnly2025!AuthService';
    private const TEST_ISSUER = 'AuthService';
    private const TEST_AUDIENCE = 'OrderFlowApp';

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_Verify_ShouldReturnPayload_WhenTokenIsValid(): void
    {
        $token = $this->makeToken([
            'sub' => 10,
            'email' => 'valid@example.com',
            'iat' => time() - 60,
            'exp' => time() + 300,
            'iss' => self::TEST_ISSUER,
            'aud' => self::TEST_AUDIENCE,
        ]);

        $verifier = new JwtVerifier();
        $payload = $verifier->verify($token);

        $this->assertSame(10, $payload->sub);
        $this->assertSame('valid@example.com', $payload->email);
    }

    public function test_Verify_ShouldThrowException_WhenRequiredClaimsAreMissing(): void
    {
        $token = $this->makeToken([
            'iat' => time() - 60,
            'exp' => time() + 300,
            'iss' => self::TEST_ISSUER,
            'aud' => self::TEST_AUDIENCE,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Token sin claims requeridos');

        (new JwtVerifier())->verify($token);
    }

    public function test_Verify_ShouldThrowException_WhenIssuerIsInvalid(): void
    {
        $token = $this->makeToken([
            'sub' => 10,
            'email' => 'valid@example.com',
            'iat' => time() - 60,
            'exp' => time() + 300,
            'iss' => 'other-issuer',
            'aud' => self::TEST_AUDIENCE,
        ]);

        try {
            (new JwtVerifier())->verify($token);
            $this->fail('Expected RuntimeException for invalid issuer.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Issuer', $e->getMessage());
        }
    }

    public function test_Verify_ShouldThrowException_WhenAudienceIsInvalid(): void
    {
        $token = $this->makeToken([
            'sub' => 10,
            'email' => 'valid@example.com',
            'iat' => time() - 60,
            'exp' => time() + 300,
            'iss' => self::TEST_ISSUER,
            'aud' => 'other-audience',
        ]);

        try {
            (new JwtVerifier())->verify($token);
            $this->fail('Expected RuntimeException for invalid audience.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Audience', $e->getMessage());
        }
    }

    /** @param array<string, mixed> $payload */
    private function makeToken(array $payload): string
    {
        return JWT::encode($payload, (string) env('JWT_SECRET', self::TEST_SECRET), 'HS256');
    }
}
