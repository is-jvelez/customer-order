<?php

namespace Tests\Feature\Api;

use App\Application\Shared\Interfaces\ICustomerService;
use App\Application\Shared\Interfaces\IOrderService;
use Mockery\MockInterface;
use Tests\Support\AuthenticatesWithJwt;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use AuthenticatesWithJwt;

    public function test_Stats_ShouldMergeCustomerAndOrderStats_WhenAuthenticated(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getOrderStats')->once()->andReturn([
                'total_orders' => 12,
                'completed_orders' => 8,
            ]);
        });
        $this->mock(ICustomerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getCustomerStats')->once()->andReturn([
                'total_customers' => 7,
                'active_customers' => 6,
            ]);
        });

        $response = $this->getJson('/api/dashboard/stats', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_orders', 12)
            ->assertJsonPath('data.total_customers', 7);
    }

    public function test_OrdersByDay_ShouldReturnSeries_WhenAuthenticated(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getOrdersByDay')->once()->andReturn([
                ['date' => '2026-05-10', 'count' => 5, 'total' => 125.0],
            ]);
        });

        $response = $this->getJson('/api/dashboard/orders-by-day', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.count', 5);
    }

    public function test_OrdersByMonth_ShouldReturnSeries_WhenAuthenticated(): void
    {
        $this->authenticateWithJwt();
        $this->mock(IOrderService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getOrdersByMonth')->once()->andReturn([
                ['date' => '2026-05', 'count' => 20, 'total' => 2500.0],
            ]);
        });

        $response = $this->getJson('/api/dashboard/orders-by-month', $this->apiHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.date', '2026-05');
    }
}

