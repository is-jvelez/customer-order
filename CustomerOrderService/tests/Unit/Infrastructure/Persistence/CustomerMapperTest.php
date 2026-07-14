<?php

namespace Tests\Unit\Infrastructure\Persistence;

use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use App\Infrastructure\Persistence\Mappers\CustomerMapper;
use App\Infrastructure\Persistence\Models\CustomerModel;
use PHPUnit\Framework\TestCase;

class CustomerMapperTest extends TestCase
{
    public function test_ToDomain_ShouldMapModelToEntity_WhenModelContainsValues(): void
    {
        $model = new CustomerModel([
            'Name' => 'Jane',
            'Email' => 'jane@example.com',
            'Phone' => '555',
            'Address' => 'Street',
            'IsActive' => 1,
        ]);
        $model->Id = 5;
        $model->CreatedAt = '2026-01-01 10:00:00';

        $mapper = new CustomerMapper();
        $entity = $mapper->toDomain($model);

        $this->assertSame(5, $entity->id);
        $this->assertSame('Jane', $entity->name);
        $this->assertSame('jane@example.com', $entity->email->value);
        $this->assertTrue($entity->isActive);
        $this->assertSame('2026-01-01 10:00:00', $entity->createdAt);
    }

    public function test_ToAttributes_ShouldMapEntityToArray_WhenEntityContainsValues(): void
    {
        $entity = new Customer(
            id: 10,
            name: 'Alex',
            email: new CustomerEmail('alex@example.com'),
            phone: '999',
            address: 'Road',
            isActive: false,
            createdAt: null,
        );

        $mapper = new CustomerMapper();
        $attributes = $mapper->toAttributes($entity);

        $this->assertSame([
            'Name' => 'Alex',
            'Email' => 'alex@example.com',
            'Phone' => '999',
            'Address' => 'Road',
            'IsActive' => 0,
        ], $attributes);
    }
}

