<?php

namespace App\Application\Orders\DTOs;

class OrderItemDTO
{
    public function __construct(
        public readonly string $description,
        public readonly int    $quantity,
        public readonly float  $unitPrice,
    ) {}
}
