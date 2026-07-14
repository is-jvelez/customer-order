<?php

namespace App\Application\Customers\Services;

use App\Application\Customers\DTOs\CreateCustomerDTO;
use App\Application\Customers\DTOs\UpdateCustomerDTO;
use App\Application\Shared\Interfaces\ICustomerService;
use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Exceptions\DuplicateEmailException;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Domain\Customers\ValueObjects\CustomerEmail;

class CustomerService implements ICustomerService
{
    public function __construct(
        private readonly ICustomerRepository $repository,
    ) {}

    /** @return Customer[] */
    public function getAll(): array
    {
        return $this->repository->findAll();
    }

    public function getById(int $id): Customer
    {
        $customer = $this->repository->findById($id);
        if ($customer === null) {
            throw new CustomerNotFoundException($id);
        }
        return $customer;
    }

    public function create(CreateCustomerDTO $dto): Customer
    {
        $existing = $this->repository->findByEmail($dto->email);
        if ($existing !== null) {
            throw new DuplicateEmailException($dto->email);
        }

        $customer = new Customer(
            id:        null,
            name:      $dto->name,
            email:     new CustomerEmail($dto->email),
            phone:     $dto->phone,
            address:   $dto->address,
            isActive:  true,
            createdAt: null,
        );

        return $this->repository->create($customer);
    }

    public function update(int $id, UpdateCustomerDTO $dto): Customer
    {
        $existing = $this->repository->findById($id);
        if ($existing === null) {
            throw new CustomerNotFoundException($id);
        }

        if ($dto->email !== null && $dto->email !== $existing->email->value) {
            $byEmail = $this->repository->findByEmail($dto->email);
            if ($byEmail !== null) {
                throw new DuplicateEmailException($dto->email);
            }
        }

        $updated = new Customer(
            id:        $existing->id,
            name:      $dto->name    ?? $existing->name,
            email:     $dto->email !== null ? new CustomerEmail($dto->email) : $existing->email,
            phone:     $dto->phone   ?? $existing->phone,
            address:   $dto->address ?? $existing->address,
            isActive:  $existing->isActive,
            createdAt: $existing->createdAt,
        );

        return $this->repository->update($updated);
    }

    public function delete(int $id): void
    {
        $customer = $this->repository->findById($id);
        if ($customer === null) {
            throw new CustomerNotFoundException($id);
        }
        $this->repository->delete($id);
    }

    public function getCustomerStats(): array
    {
        return $this->repository->getStats();
    }
}
