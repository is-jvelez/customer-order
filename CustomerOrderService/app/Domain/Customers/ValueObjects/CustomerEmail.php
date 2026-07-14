<?php

namespace App\Domain\Customers\ValueObjects;

use InvalidArgumentException;

class CustomerEmail
{
    public readonly string $value;

    public function __construct(string $email)
    {
        $normalized = strtolower(trim($email));

        if (!filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("El email '{$email}' no es válido.");
        }

        $this->value = $normalized;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(CustomerEmail $other): bool
    {
        return $this->value === $other->value;
    }
}
