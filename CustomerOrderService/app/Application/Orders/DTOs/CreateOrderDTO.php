<?php

namespace App\Application\Orders\DTOs;

class CreateOrderDTO
{
    /** @param OrderItemDTO[] $items */
    public function __construct(
        public readonly int     $customerId,
        public readonly array   $items,
        public readonly ?string $notes = null,
    ) {}
}
