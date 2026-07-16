<?php

namespace Tests\Unit\Domain\Entities;

use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Enums\OrderPriority;
use PHPUnit\Framework\TestCase;

class DomainEntitiesTest extends TestCase
{
    public function test_Customer_ShouldExposeAllConstructorValues_WhenCreated(): void
    {
        $customer = new Customer(
            id: 10,
            name: 'Alice',
            email: new CustomerEmail('alice@example.com'),
            phone: '123456',
            address: 'Main Street',
            isActive: true,
            createdAt: '2026-01-01 10:00:00',
        );

        $this->assertSame(10, $customer->id);
        $this->assertSame('Alice', $customer->name);
        $this->assertSame('alice@example.com', $customer->email->value);
        $this->assertSame('123456', $customer->phone);
        $this->assertSame('Main Street', $customer->address);
        $this->assertTrue($customer->isActive);
        $this->assertSame('2026-01-01 10:00:00', $customer->createdAt);
    }

    public function test_OrderAndOrderItem_ShouldExposeAllConstructorValues_WhenCreated(): void
    {
        $item = new OrderItem(
            id: 2,
            orderId: 1,
            description: 'Keyboard',
            quantity: 3,
            unitPrice: 25.5,
        );

        $order = new Order(
            id: 1,
            customerId: 9,
            status: OrderStatus::Pending,
            total: 76.5,
            notes: 'Urgent',
            createdAt: '2026-01-02 11:00:00',
            updatedAt: '2026-01-02 11:30:00',
            items: [$item],
        );

        $this->assertSame(1, $order->id);
        $this->assertSame(9, $order->customerId);
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame(76.5, $order->total);
        $this->assertSame('Urgent', $order->notes);
        $this->assertCount(1, $order->items);
        $this->assertSame('Keyboard', $order->items[0]->description);
        $this->assertSame(OrderPriority::Medium, $order->priority);
    }

    public function test_Order_ShouldExposeExplicitPriority_WhenProvided(): void
    {
        $order = new Order(
            id: 2,
            customerId: 9,
            status: OrderStatus::Pending,
            total: 10.0,
            notes: null,
            createdAt: null,
            updatedAt: null,
            items: [],
            priority: OrderPriority::High,
        );

        $this->assertSame(OrderPriority::High, $order->priority);
        $this->assertSame(3, $order->priority->value);
    }
}

