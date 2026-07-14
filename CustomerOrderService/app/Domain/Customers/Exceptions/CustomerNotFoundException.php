<?php

namespace App\Domain\Customers\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

class CustomerNotFoundException extends DomainException
{
    public function __construct(int $id)
    {
        parent::__construct("Cliente con ID {$id} no encontrado.");
    }
}
