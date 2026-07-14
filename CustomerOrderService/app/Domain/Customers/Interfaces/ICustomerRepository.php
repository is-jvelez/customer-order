<?php

namespace App\Domain\Customers\Interfaces;

use App\Domain\Customers\Entities\Customer;

interface ICustomerRepository
{
    /** @return Customer[] */
    public function findAll(): array;

    public function findById(int $id): ?Customer;

    public function findByEmail(string $email): ?Customer;

    public function create(Customer $customer): Customer;

    public function update(Customer $customer): Customer;

    public function delete(int $id): void;

    /** @return array{total_customers: int, active_customers: int} */
    public function getStats(): array;
}
