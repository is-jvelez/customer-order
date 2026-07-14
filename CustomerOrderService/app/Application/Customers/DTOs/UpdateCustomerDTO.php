<?php

namespace App\Application\Customers\DTOs;

class UpdateCustomerDTO
{
    public function __construct(
        public readonly ?string $name    = null,
        public readonly ?string $email   = null,
        public readonly ?string $phone   = null,
        public readonly ?string $address = null,
    ) {}
}
