<?php

namespace Tests\Unit\Infrastructure\Providers;

use App\Application\Customers\Services\CustomerService;
use App\Application\Orders\Services\OrderService;
use App\Application\Shared\Interfaces\ICustomerService;
use App\Application\Shared\Interfaces\IOrderService;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Domain\Orders\Interfaces\IOrderRepository;
use App\Infrastructure\Persistence\Repositories\EloquentCustomerRepository;
use App\Infrastructure\Persistence\Repositories\EloquentOrderRepository;
use Tests\TestCase;

class DomainServiceProviderTest extends TestCase
{
    public function test_Bindings_ShouldResolveExpectedImplementations_WhenContainerResolvesInterfaces(): void
    {
        $this->assertInstanceOf(EloquentCustomerRepository::class, $this->app->make(ICustomerRepository::class));
        $this->assertInstanceOf(EloquentOrderRepository::class, $this->app->make(IOrderRepository::class));
        $this->assertInstanceOf(CustomerService::class, $this->app->make(ICustomerService::class));
        $this->assertInstanceOf(OrderService::class, $this->app->make(IOrderService::class));
    }
}

