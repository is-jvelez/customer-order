<?php

namespace App\Domain\Customers\Entities;

use App\Domain\Customers\ValueObjects\CustomerEmail;

class Customer
{
    public function __construct(
        public readonly ?int    $id,
        public readonly string  $name,
        public readonly CustomerEmail $email,
        public readonly ?string $phone,
        public readonly ?string $address,
        public readonly bool    $isActive,
        public readonly ?string $createdAt,
    ) {}
}
