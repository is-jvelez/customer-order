<?php

namespace App\Application\Orders\DTOs;

class UpdateOrderDTO
{
    public function __construct(
        public readonly ?string $notes = null,
        public readonly ?int    $priority = null,
    ) {}
}
