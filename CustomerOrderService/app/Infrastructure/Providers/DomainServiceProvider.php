<?php

namespace App\Infrastructure\Providers;

use App\Application\Customers\Services\CustomerService;
use App\Application\Orders\Services\OrderService;
use App\Application\Shared\Interfaces\ICustomerService;
use App\Application\Shared\Interfaces\IOrderService;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Domain\Orders\Interfaces\IOrderRepository;
use App\Infrastructure\Persistence\Repositories\EloquentCustomerRepository;
use App\Infrastructure\Persistence\Repositories\EloquentOrderRepository;
use Illuminate\Support\ServiceProvider;

class DomainServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ICustomerRepository::class, EloquentCustomerRepository::class);
        $this->app->bind(IOrderRepository::class,    EloquentOrderRepository::class);
        $this->app->bind(ICustomerService::class,    CustomerService::class);
        $this->app->bind(IOrderService::class,       OrderService::class);
    }
}
