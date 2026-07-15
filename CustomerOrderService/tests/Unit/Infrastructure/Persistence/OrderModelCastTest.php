<?php

namespace Tests\Unit\Infrastructure\Persistence;

use App\Enums\OrderPriority;
use App\Infrastructure\Persistence\Models\OrderModel;
use PHPUnit\Framework\TestCase;

class OrderModelCastTest extends TestCase
{
    public function test_Priority_ShouldCastToOrderPriorityEnum_WhenAttributeIsAnInteger(): void
    {
        $model = new OrderModel([
            'CustomerId' => 1,
            'Status' => 'Pending',
            'Priority' => 3,
        ]);

        $this->assertInstanceOf(OrderPriority::class, $model->Priority);
        $this->assertSame(OrderPriority::High, $model->Priority);
        $this->assertSame(3, $model->Priority->value);
    }

    public function test_Priority_ShouldBeFillable_WhenMassAssigned(): void
    {
        $model = new OrderModel([
            'CustomerId' => 1,
            'Status' => 'Pending',
            'Priority' => 1,
        ]);

        $this->assertContains('Priority', $model->getFillable());
        $this->assertSame(OrderPriority::Low, $model->Priority);
    }
}
