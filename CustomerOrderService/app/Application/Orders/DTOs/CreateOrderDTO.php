<?php

namespace App\Application\Orders\DTOs;

use App\Enums\OrderPriority;

class CreateOrderDTO
{
    /** @param OrderItemDTO[] $items */
    public function __construct(
        public readonly int     $customerId,
        public readonly array   $items,
        public readonly ?string $notes = null,
        public readonly OrderPriority $priority = OrderPriority::Medium,
    ) {}
}
