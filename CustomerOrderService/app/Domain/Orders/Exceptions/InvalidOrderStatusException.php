<?php

namespace App\Domain\Orders\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

class InvalidOrderStatusException extends DomainException
{
    public function __construct(string $from, string $to)
    {
        parent::__construct("No se puede cambiar el estado de '{$from}' a '{$to}'.");
    }
}
