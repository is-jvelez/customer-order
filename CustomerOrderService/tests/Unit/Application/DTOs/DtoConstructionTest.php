<?php

namespace Tests\Unit\Application\DTOs;

use App\Application\Customers\DTOs\CreateCustomerDTO;
use App\Application\Customers\DTOs\UpdateCustomerDTO;
use App\Application\Orders\DTOs\CreateOrderDTO;
use App\Application\Orders\DTOs\OrderItemDTO;
use App\Application\Orders\DTOs\UpdateOrderDTO;
use App\Enums\OrderPriority;
use PHPUnit\Framework\TestCase;

class DtoConstructionTest extends TestCase
{
    public function test_DTOs_ShouldExposeProvidedValues_WhenConstructed(): void
    {
        $createCustomer = new CreateCustomerDTO(
            name: 'Bob',
            email: 'bob@example.com',
            phone: '999',
            address: 'Street 1',
        );

        $updateCustomer = new UpdateCustomerDTO(
            name: 'Bobby',
            email: 'bobby@example.com',
            phone: null,
            address: null,
        );

        $item = new OrderItemDTO(description: 'Mouse', quantity: 2, unitPrice: 10.0);
        $createOrder = new CreateOrderDTO(customerId: 5, items: [$item], notes: 'Handle with care');
        $updateOrder = new UpdateOrderDTO(notes: 'Updated note');

        $this->assertSame('Bob', $createCustomer->name);
        $this->assertSame('bobby@example.com', $updateCustomer->email);
        $this->assertSame('Mouse', $item->description);
        $this->assertSame(5, $createOrder->customerId);
        $this->assertCount(1, $createOrder->items);
        $this->assertSame('Updated note', $updateOrder->notes);
        $this->assertSame(OrderPriority::Medium, $createOrder->priority);
        $this->assertNull($updateOrder->priority);
    }

    public function test_CreateOrderDTO_ShouldExposeExplicitPriority_WhenProvided(): void
    {
        $dto = new CreateOrderDTO(
            customerId: 7,
            items: [new OrderItemDTO(description: 'Chair', quantity: 1, unitPrice: 99.0)],
            priority: OrderPriority::High,
        );

        $this->assertSame(OrderPriority::High, $dto->priority);
    }

    public function test_UpdateOrderDTO_ShouldExposeExplicitPriority_WhenProvided(): void
    {
        $dto = new UpdateOrderDTO(notes: 'n', priority: OrderPriority::Low);

        $this->assertSame(OrderPriority::Low, $dto->priority);
    }
}

