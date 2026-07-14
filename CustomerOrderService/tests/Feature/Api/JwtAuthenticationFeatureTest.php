<?php

namespace Tests\Feature\Api;

use App\Application\Shared\Interfaces\ICustomerService;
use Mockery\MockInterface;
use Tests\Support\AuthenticatesWithJwt;
use Tests\TestCase;

class JwtAuthenticationFeatureTest extends TestCase
{
    use AuthenticatesWithJwt;

    public function test_CustomersEndpoint_ShouldReturn401_WhenTokenIsMissing(): void
    {
        $response = $this->getJson('/api/customers');

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_CustomersEndpoint_ShouldReturn401_WhenTokenIsInvalid(): void
    {
        $this->authenticateWithInvalidJwt('signature check failed');

        $response = $this->getJson('/api/customers', $this->apiHeaders('bad-token'));

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_CustomersEndpoint_ShouldPass_WhenTokenIsValid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getAll')->once()->andReturn([]);
        });

        $response = $this->getJson('/api/customers', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', []);
    }
}

