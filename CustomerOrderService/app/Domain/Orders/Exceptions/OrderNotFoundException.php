<?php

namespace App\Domain\Orders\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

class OrderNotFoundException extends DomainException
{
    public function __construct(int $id)
    {
        parent::__construct("Pedido con ID {$id} no encontrado.");
    }
}
