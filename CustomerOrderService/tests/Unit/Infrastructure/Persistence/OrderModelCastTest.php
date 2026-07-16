<?php

namespace Tests\Unit\Infrastructure\Persistence;

use App\Enums\OrderPriority;
use App\Infrastructure\Persistence\Models\OrderModel;
use PHPUnit\Framework\TestCase;

class OrderModelCastTest extends TestCase
{
    public function test_Priority_ShouldBeFillable_WhenModelIsDefined(): void
    {
        $model = new OrderModel();

        $this->assertContains('Priority', $model->getFillable());
    }

    public function test_Priority_ShouldCastToOrderPriorityEnum_WhenAttributeIsSet(): void
    {
        $model = new OrderModel(['Priority' => 3]);

        $this->assertInstanceOf(OrderPriority::class, $model->Priority);
        $this->assertSame(OrderPriority::High, $model->Priority);
    }

    public function test_Priority_ShouldCastLowAndMediumValues_WhenAttributeIsSet(): void
    {
        $low = new OrderModel(['Priority' => 1]);
        $medium = new OrderModel(['Priority' => 2]);

        $this->assertSame(OrderPriority::Low, $low->Priority);
        $this->assertSame(OrderPriority::Medium, $medium->Priority);
    }
}
