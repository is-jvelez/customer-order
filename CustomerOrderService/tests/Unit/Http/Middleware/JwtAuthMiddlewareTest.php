<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\JwtAuthMiddleware;
use App\Infrastructure\Security\JwtVerifier;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class JwtAuthMiddlewareTest extends TestCase
{
    public function test_Handle_ShouldReturn401_WhenAuthorizationHeaderIsMissing(): void
    {
        $verifier = $this->createMock(JwtVerifier::class);
        $middleware = new JwtAuthMiddleware($verifier);
        $request = Request::create('/api/customers', 'GET');

        $response = $middleware->handle($request, fn(Request $req): Response => response()->json(['ok' => true]));

        $this->assertSame(401, $response->getStatusCode());
        $json = json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertFalse($json['success']);
    }

    public function test_Handle_ShouldReturn401_WhenVerifierThrowsException(): void
    {
        $verifier = $this->createMock(JwtVerifier::class);
        $verifier->expects($this->once())
            ->method('verify')
            ->with('bad-token')
            ->willThrowException(new \RuntimeException('invalid token'));

        $middleware = new JwtAuthMiddleware($verifier);
        $request = Request::create('/api/customers', 'GET');
        $request->headers->set('Authorization', 'Bearer bad-token');

        $response = $middleware->handle($request, fn(Request $req): Response => response()->json(['ok' => true]));

        $this->assertSame(401, $response->getStatusCode());
        $json = json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertFalse($json['success']);
        $this->assertNotEmpty($json['errors']);
    }

    public function test_Handle_ShouldMergeAuthPayloadAndContinue_WhenTokenIsValid(): void
    {
        $verifier = $this->createMock(JwtVerifier::class);
        $verifier->expects($this->once())
            ->method('verify')
            ->with('good-token')
            ->willReturn((object) ['sub' => 321, 'email' => 'auth@example.com']);

        $middleware = new JwtAuthMiddleware($verifier);
        $request = Request::create('/api/customers', 'GET');
        $request->headers->set('Authorization', 'Bearer good-token');

        $response = $middleware->handle($request, function (Request $incoming): Response {
            return response()->json([
                'auth_user_id' => $incoming->input('auth_user_id'),
                'auth_email' => $incoming->input('auth_email'),
            ]);
        });

        $this->assertSame(200, $response->getStatusCode());
        $json = json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(321, $json['auth_user_id']);
        $this->assertSame('auth@example.com', $json['auth_email']);
    }
}

