<?php

namespace App\Application\Customers\DTOs;

class CreateCustomerDTO
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $email,
        public readonly ?string $phone   = null,
        public readonly ?string $address = null,
    ) {}
}
