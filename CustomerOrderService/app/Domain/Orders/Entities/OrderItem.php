<?php

namespace App\Domain\Orders\Entities;

class OrderItem
{
    public function __construct(
        public readonly ?int   $id,
        public readonly ?int   $orderId,
        public readonly string $description,
        public readonly int    $quantity,
        public readonly float  $unitPrice,
    ) {}
}
