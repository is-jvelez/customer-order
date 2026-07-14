<?php

namespace App\Application\Shared\Interfaces;

use App\Application\Customers\DTOs\CreateCustomerDTO;
use App\Application\Customers\DTOs\UpdateCustomerDTO;
use App\Domain\Customers\Entities\Customer;

interface ICustomerService
{
    /** @return Customer[] */
    public function getAll(): array;

    public function getById(int $id): Customer;

    public function create(CreateCustomerDTO $dto): Customer;

    public function update(int $id, UpdateCustomerDTO $dto): Customer;

    public function delete(int $id): void;

    /** @return array{total_customers: int, active_customers: int} */
    public function getCustomerStats(): array;
}
