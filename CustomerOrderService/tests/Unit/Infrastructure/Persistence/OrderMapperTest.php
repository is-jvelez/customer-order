<?php

namespace Tests\Unit\Infrastructure\Persistence;

use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Enums\OrderPriority;
use App\Infrastructure\Persistence\Mappers\OrderMapper;
use App\Infrastructure\Persistence\Models\OrderItemModel;
use App\Infrastructure\Persistence\Models\OrderModel;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class OrderMapperTest extends TestCase
{
    public function test_ToDomain_ShouldMapOrderWithoutItems_WhenRelationIsNotLoaded(): void
    {
        $model = new OrderModel([
            'CustomerId' => 9,
            'Status' => 'Pending',
            'Notes' => 'No relation',
            'Priority' => 3,
        ]);
        $model->Id = 100;
        $model->Total = 55.5;
        $model->CreatedAt = '2026-01-02 09:00:00';
        $model->UpdatedAt = '2026-01-02 09:10:00';

        $mapper = new OrderMapper();
        $order = $mapper->toDomain($model);

        $this->assertSame(100, $order->id);
        $this->assertSame(9, $order->customerId);
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame(55.5, $order->total);
        $this->assertSame(OrderPriority::High, $order->priority);
        $this->assertCount(0, $order->items);
    }

    public function test_ToDomain_ShouldDefaultPriorityToMedium_WhenModelHasNoPriorityAttribute(): void
    {
        $model = new OrderModel([
            'CustomerId' => 1,
            'Status' => 'Pending',
        ]);
        $model->Id = 200;
        $model->Total = 0;
        $model->CreatedAt = '2026-01-02 09:00:00';
        $model->UpdatedAt = '2026-01-02 09:10:00';

        $mapper = new OrderMapper();
        $order = $mapper->toDomain($model);

        $this->assertSame(OrderPriority::Medium, $order->priority);
    }

    public function test_ToDomain_ShouldMapOrderAndItems_WhenRelationIsLoaded(): void
    {
        $item1 = new OrderItemModel([
            'OrderId' => 3,
            'Description' => 'Item A',
            'Quantity' => 2,
            'UnitPrice' => 10.0,
        ]);
        $item1->Id = 11;

        $item2 = new OrderItemModel([
            'OrderId' => 3,
            'Description' => 'Item B',
            'Quantity' => 1,
            'UnitPrice' => 20.0,
        ]);
        $item2->Id = 12;

        $model = new OrderModel([
            'CustomerId' => 4,
            'Status' => 'Completed',
            'Notes' => 'Done',
            'Priority' => 1,
        ]);
        $model->Id = 3;
        $model->Total = 40.0;
        $model->CreatedAt = '2026-01-03 10:00:00';
        $model->UpdatedAt = '2026-01-03 10:15:00';
        $model->setRelation('items', new Collection([$item1, $item2]));

        $mapper = new OrderMapper();
        $order = $mapper->toDomain($model);

        $this->assertSame(OrderStatus::Completed, $order->status);
        $this->assertSame(OrderPriority::Low, $order->priority);
        $this->assertCount(2, $order->items);
        $this->assertSame('Item A', $order->items[0]->description);
        $this->assertSame(2, $order->items[0]->quantity);
        $this->assertSame(20.0, $order->items[1]->unitPrice);
    }
}

