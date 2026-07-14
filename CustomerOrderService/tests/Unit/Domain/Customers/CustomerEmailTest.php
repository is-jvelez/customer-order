<?php

namespace Tests\Unit\Domain\Customers;

use App\Domain\Customers\ValueObjects\CustomerEmail;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CustomerEmailTest extends TestCase
{
    public function test_Construct_ShouldNormalizeEmail_WhenInputContainsUppercaseAndSpaces(): void
    {
        $email = new CustomerEmail('  USER@Example.COM ');

        $this->assertSame('user@example.com', $email->value);
        $this->assertSame('user@example.com', (string) $email);
    }

    public function test_Construct_ShouldThrowException_WhenEmailFormatIsInvalid(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new CustomerEmail('not-an-email');
    }

    public function test_Equals_ShouldReturnTrue_WhenEmailsAreEquivalentAfterNormalization(): void
    {
        $a = new CustomerEmail('USER@example.com');
        $b = new CustomerEmail('user@example.com');

        $this->assertTrue($a->equals($b));
    }
}

