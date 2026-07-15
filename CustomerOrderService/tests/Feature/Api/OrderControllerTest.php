<?php

namespace Tests\Feature\Api;

use App\Application\Shared\Interfaces\IOrderService;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\Exceptions\InvalidOrderStatusException;
use App\Domain\Orders\Exceptions\OrderNotFoundException;
use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Enums\OrderPriority;
use Mockery\MockInterface;
use Tests\Support\AuthenticatesWithJwt;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use AuthenticatesWithJwt;

    public function test_Index_ShouldReturnOrdersAndPagination_WhenAuthenticated(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getAll')
                ->once()
                ->andReturn([
                    'items' => [$this->makeOrder(1, OrderStatus::Pending)],
                    'pagination' => [
                        'total' => 1,
                        'per_page' => 15,
                        'current_page' => 1,
                        'last_page' => 1,
                        'from' => 1,
                        'to' => 1,
                    ],
                ]);
        });

        $response = $this->getJson('/api/orders?per_page=15&page=1', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.status', 'Pending');
    }

    public function test_Index_ShouldForwardPriorityFilter_WhenQueryParamIsProvided(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getAll')
                ->once()
                ->with($this->callback(fn(array $filters): bool => ($filters['priority'] ?? null) === '3'))
                ->andReturn([
                    'items' => [$this->makeOrder(1, OrderStatus::Pending)],
                    'pagination' => [
                        'total' => 1,
                        'per_page' => 15,
                        'current_page' => 1,
                        'last_page' => 1,
                        'from' => 1,
                        'to' => 1,
                    ],
                ]);
        });

        $response = $this->getJson('/api/orders?priority=3', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_Store_ShouldReturn201_WhenPayloadIsValid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('create')
                ->once()
                ->andReturn($this->makeOrder(9, OrderStatus::Pending));
        });

        $payload = [
            'customer_id' => 1,
            'notes' => 'Handle fast',
            'items' => [
                ['description' => 'Keyboard', 'quantity' => 1, 'unit_price' => 45.5],
            ],
        ];

        $response = $this->postJson('/api/orders', $payload, $this->apiHeaders());

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', 9);
    }

    public function test_Store_ShouldReturn422_WhenCustomerDoesNotExist(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('create')
                ->once()
                ->andThrow(new CustomerNotFoundException(88));
        });

        $response = $this->postJson('/api/orders', [
            'customer_id' => 88,
            'items' => [
                ['description' => 'Keyboard', 'quantity' => 1, 'unit_price' => 45.5],
            ],
        ], $this->apiHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_Store_ShouldReturn422_WhenPayloadIsInvalid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('create');
        });

        $response = $this->postJson('/api/orders', [
            'customer_id' => 0,
            'items' => [],
        ], $this->apiHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /** @dataProvider invalidPriorityProvider */
    public function test_Store_ShouldReturn422_WhenPriorityIsInvalid(mixed $invalidPriority): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('create');
        });

        $response = $this->postJson('/api/orders', [
            'customer_id' => 1,
            'priority' => $invalidPriority,
            'items' => [
                ['description' => 'Keyboard', 'quantity' => 1, 'unit_price' => 45.5],
            ],
        ], $this->apiHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public static function invalidPriorityProvider(): array
    {
        return [
            'zero' => [0],
            'four' => [4],
            'nine' => [9],
            'non_numeric' => ['x'],
        ];
    }

    public function test_Store_ShouldReturn201WithPriority_WhenPriorityIsValid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('create')
                ->once()
                ->andReturn($this->makeOrder(9, OrderStatus::Pending, OrderPriority::High));
        });

        $payload = [
            'customer_id' => 1,
            'priority' => 3,
            'items' => [
                ['description' => 'Keyboard', 'quantity' => 1, 'unit_price' => 45.5],
            ],
        ];

        $response = $this->postJson('/api/orders', $payload, $this->apiHeaders());

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.priority', 3);
    }

    public function test_Complete_ShouldReturn409_WhenStatusTransitionIsInvalid(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('complete')
                ->once()
                ->with(2)
                ->andThrow(new InvalidOrderStatusException('Completed', 'Completed'));
        });

        $response = $this->patchJson('/api/orders/2/complete', [], $this->apiHeaders());

        $response->assertStatus(409)
            ->assertJsonPath('success', false);
    }

    public function test_Cancel_ShouldReturn404_WhenOrderDoesNotExist(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('cancel')
                ->once()
                ->with(30)
                ->andThrow(new OrderNotFoundException(30));
        });

        $response = $this->patchJson('/api/orders/30/cancel', [], $this->apiHeaders());

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_Destroy_ShouldReturnSuccess_WhenOrderExists(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('delete')
                ->once()
                ->with(4);
        });

        $response = $this->deleteJson('/api/orders/4', [], $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    private function makeOrder(int $id, OrderStatus $status, OrderPriority $priority = OrderPriority::Medium): Order
    {
        return new Order(
            id: $id,
            customerId: 1,
            status: $status,
            total: 45.5,
            notes: 'note',
            createdAt: '2026-01-01 10:00:00',
            updatedAt: '2026-01-01 10:05:00',
            items: [
                new OrderItem(
                    id: 1,
                    orderId: $id,
                    description: 'Keyboard',
                    quantity: 1,
                    unitPrice: 45.5,
                ),
            ],
            priority: $priority,
        );
    }
}

