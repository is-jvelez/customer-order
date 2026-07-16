<?php

namespace App\Application\Orders\DTOs;

use App\Enums\OrderPriority;

class UpdateOrderDTO
{
    public function __construct(
        public readonly ?string $notes = null,
        public readonly ?OrderPriority $priority = null,
    ) {}
}
