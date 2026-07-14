<?php

namespace App\Domain\Customers\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

class DuplicateEmailException extends DomainException
{
    public function __construct(string $email)
    {
        parent::__construct("El email '{$email}' ya está registrado.");
    }
}
