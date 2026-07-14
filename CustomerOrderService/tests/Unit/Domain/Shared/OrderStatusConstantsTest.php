<?php

namespace Tests\Unit\Domain\Shared;

use App\Domain\Shared\Constants\OrderStatusConstants;
use PHPUnit\Framework\TestCase;

class OrderStatusConstantsTest extends TestCase
{
    public function test_ALL_ShouldContainEveryStatusConstant_WhenRead(): void
    {
        $this->assertSame([
            OrderStatusConstants::PENDING,
            OrderStatusConstants::IN_PROGRESS,
            OrderStatusConstants::COMPLETED,
            OrderStatusConstants::CANCELLED,
        ], OrderStatusConstants::ALL);
    }
}

