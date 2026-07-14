<?php

namespace Tests\Unit\Domain\Orders;

use App\Domain\Orders\ValueObjects\OrderStatus;
use PHPUnit\Framework\TestCase;

class OrderStatusTest extends TestCase
{
    public function test_CanTransitionTo_ShouldAllowValidPendingTransitions_WhenTargetIsAllowed(): void
    {
        $this->assertTrue(OrderStatus::Pending->canTransitionTo(OrderStatus::InProgress));
        $this->assertTrue(OrderStatus::Pending->canTransitionTo(OrderStatus::Completed));
        $this->assertTrue(OrderStatus::Pending->canTransitionTo(OrderStatus::Cancelled));
    }

    public function test_CanTransitionTo_ShouldAllowValidInProgressTransitions_WhenTargetIsAllowed(): void
    {
        $this->assertTrue(OrderStatus::InProgress->canTransitionTo(OrderStatus::Completed));
        $this->assertTrue(OrderStatus::InProgress->canTransitionTo(OrderStatus::Cancelled));
    }

    public function test_CanTransitionTo_ShouldRejectInvalidTransitions_WhenSourceIsTerminal(): void
    {
        $this->assertFalse(OrderStatus::Completed->canTransitionTo(OrderStatus::Pending));
        $this->assertFalse(OrderStatus::Cancelled->canTransitionTo(OrderStatus::InProgress));
    }
}

