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
            'Priority' => 1,
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
        $this->assertCount(0, $order->items);
        $this->assertSame(OrderPriority::Low, $order->priority);
    }

    /** @dataProvider priorityValuesProvider */
    public function test_ToDomain_ShouldMapPriorityForEveryValue_WhenModelHasPriority(int $rawValue, OrderPriority $expected): void
    {
        $model = new OrderModel([
            'CustomerId' => 1,
            'Status' => 'Pending',
            'Notes' => null,
            'Priority' => $rawValue,
        ]);
        $model->Id = 1;
        $model->Total = 0;
        $model->CreatedAt = '2026-01-01 00:00:00';
        $model->UpdatedAt = '2026-01-01 00:00:00';

        $order = (new OrderMapper())->toDomain($model);

        $this->assertSame($expected, $order->priority);
    }

    public static function priorityValuesProvider(): array
    {
        return [
            'Low'    => [1, OrderPriority::Low],
            'Medium' => [2, OrderPriority::Medium],
            'High'   => [3, OrderPriority::High],
        ];
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
            'Priority' => 3,
        ]);
        $model->Id = 3;
        $model->Total = 40.0;
        $model->CreatedAt = '2026-01-03 10:00:00';
        $model->UpdatedAt = '2026-01-03 10:15:00';
        $model->setRelation('items', new Collection([$item1, $item2]));

        $mapper = new OrderMapper();
        $order = $mapper->toDomain($model);

        $this->assertSame(OrderStatus::Completed, $order->status);
        $this->assertCount(2, $order->items);
        $this->assertSame('Item A', $order->items[0]->description);
        $this->assertSame(2, $order->items[0]->quantity);
        $this->assertSame(20.0, $order->items[1]->unitPrice);
        $this->assertSame(OrderPriority::High, $order->priority);
    }
}

