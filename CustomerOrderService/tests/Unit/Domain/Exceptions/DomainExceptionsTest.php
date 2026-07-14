<?php

namespace Tests\Unit\Domain\Exceptions;

use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Exceptions\DuplicateEmailException;
use App\Domain\Orders\Exceptions\InvalidOrderStatusException;
use App\Domain\Orders\Exceptions\OrderNotFoundException;
use PHPUnit\Framework\TestCase;

class DomainExceptionsTest extends TestCase
{
    public function test_Exceptions_ShouldContainBusinessContext_WhenInstantiated(): void
    {
        $this->assertStringContainsString('15', (new CustomerNotFoundException(15))->getMessage());
        $this->assertStringContainsString('mail@example.com', (new DuplicateEmailException('mail@example.com'))->getMessage());
        $this->assertStringContainsString('33', (new OrderNotFoundException(33))->getMessage());
        $this->assertStringContainsString('Pending', (new InvalidOrderStatusException('Pending', 'Completed'))->getMessage());
    }
}

