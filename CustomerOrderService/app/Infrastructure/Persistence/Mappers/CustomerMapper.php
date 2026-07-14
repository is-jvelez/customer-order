<?php

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use App\Infrastructure\Persistence\Models\CustomerModel;

class CustomerMapper
{
    public function toDomain(CustomerModel $model): Customer
    {
        return new Customer(
            id:        $model->Id,
            name:      $model->Name,
            email:     new CustomerEmail($model->Email),
            phone:     $model->Phone,
            address:   $model->Address,
            isActive:  (bool) $model->IsActive,
            createdAt: $model->CreatedAt,
        );
    }

    /** @return array<string, mixed> */
    public function toAttributes(Customer $entity): array
    {
        return [
            'Name'     => $entity->name,
            'Email'    => (string) $entity->email,
            'Phone'    => $entity->phone,
            'Address'  => $entity->address,
            'IsActive' => $entity->isActive ? 1 : 0,
        ];
    }
}
