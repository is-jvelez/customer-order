<?php

namespace Tests\Unit\Enums;

use App\Enums\OrderPriority;
use PHPUnit\Framework\TestCase;

class OrderPriorityTest extends TestCase
{
    public function test_Cases_ShouldExposeExpectedIntegerValues_WhenRead(): void
    {
        $this->assertSame(1, OrderPriority::Low->value);
        $this->assertSame(2, OrderPriority::Medium->value);
        $this->assertSame(3, OrderPriority::High->value);
    }

    public function test_From_ShouldResolveCase_WhenValueIsValid(): void
    {
        $this->assertSame(OrderPriority::Low, OrderPriority::from(1));
        $this->assertSame(OrderPriority::Medium, OrderPriority::from(2));
        $this->assertSame(OrderPriority::High, OrderPriority::from(3));
    }

    public function test_From_ShouldThrow_WhenValueIsInvalid(): void
    {
        $this->expectException(\ValueError::class);

        OrderPriority::from(0);
    }
}
