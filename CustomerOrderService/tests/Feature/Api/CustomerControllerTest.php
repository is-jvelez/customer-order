<?php

namespace Tests\Feature\Api;

use App\Application\Shared\Interfaces\ICustomerService;
use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Exceptions\DuplicateEmailException;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use Mockery\MockInterface;
use Tests\Support\AuthenticatesWithJwt;
use Tests\TestCase;

class CustomerControllerTest extends TestCase
{
    use AuthenticatesWithJwt;

    public function test_Index_ShouldReturnCustomerList_WhenAuthenticated(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getAll')
                ->once()
                ->andReturn([
                    $this->makeCustomer(1, 'Alice', 'alice@example.com'),
                    $this->makeCustomer(2, 'Bob', 'bob@example.com'),
                ]);
        });

        $response = $this->getJson('/api/customers', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.email', 'alice@example.com');
    }

    public function test_Store_ShouldReturn201_WhenPayloadIsValid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('create')
                ->once()
                ->andReturn($this->makeCustomer(10, 'John', 'john@example.com'));
        });

        $payload = [
            'name' => 'John',
            'email' => 'john@example.com',
            'phone' => '777',
            'address' => 'Any street',
        ];

        $response = $this->postJson('/api/customers', $payload, $this->apiHeaders());

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', 10)
            ->assertJsonPath('data.email', 'john@example.com');
    }

    public function test_Store_ShouldReturn409_WhenEmailIsDuplicated(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('create')
                ->once()
                ->andThrow(new DuplicateEmailException('john@example.com'));
        });

        $response = $this->postJson('/api/customers', [
            'name' => 'John',
            'email' => 'john@example.com',
        ], $this->apiHeaders());

        $response->assertStatus(409)
            ->assertJsonPath('success', false);
    }

    public function test_Store_ShouldReturn422_WhenPayloadIsInvalid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('create');
        });

        $response = $this->postJson('/api/customers', [
            'name' => '',
            'email' => 'bad-format',
        ], $this->apiHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonCount(2, 'errors');
    }

    public function test_Show_ShouldReturn404_WhenCustomerDoesNotExist(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getById')
                ->once()
                ->with(99)
                ->andThrow(new CustomerNotFoundException(99));
        });

        $response = $this->getJson('/api/customers/99', $this->apiHeaders());

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_Destroy_ShouldReturnSuccess_WhenCustomerExists(): void
    {
        $this->authenticateWithJwt();
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('delete')
                ->once()
                ->with(3);
        });

        $response = $this->deleteJson('/api/customers/3', [], $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    private function makeCustomer(int $id, string $name, string $email): Customer
    {
        return new Customer(
            id: $id,
            name: $name,
            email: new CustomerEmail($email),
            phone: null,
            address: null,
            isActive: true,
            createdAt: '2026-01-01 00:00:00',
        );
    }
}
