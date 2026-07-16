<?php

namespace App\Domain\Orders\Entities;

use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Enums\OrderPriority;

class Order
{
    /** @param OrderItem[] $items */
    public function __construct(
        public readonly ?int    $id,
        public readonly int     $customerId,
        public readonly OrderStatus $status,
        public readonly float   $total,
        public readonly ?string $notes,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
        public readonly array   $items = [],
        public readonly OrderPriority $priority = OrderPriority::Medium,
    ) {}
}
