<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Infrastructure\Persistence\Mappers\CustomerMapper;
use App\Infrastructure\Persistence\Models\CustomerModel;

class EloquentCustomerRepository implements ICustomerRepository
{
    public function __construct(
        private readonly CustomerMapper $mapper,
    ) {}

    /** @return Customer[] */
    public function findAll(): array
    {
        return CustomerModel::all()
            ->map(fn(CustomerModel $m) => $this->mapper->toDomain($m))
            ->all();
    }

    public function findById(int $id): ?Customer
    {
        $model = CustomerModel::find($id);
        return $model ? $this->mapper->toDomain($model) : null;
    }

    public function findByEmail(string $email): ?Customer
    {
        $model = CustomerModel::where('Email', strtolower($email))->first();
        return $model ? $this->mapper->toDomain($model) : null;
    }

    public function create(Customer $customer): Customer
    {
        $model = CustomerModel::create($this->mapper->toAttributes($customer));
        return $this->mapper->toDomain($model);
    }

    public function update(Customer $customer): Customer
    {
        $model = CustomerModel::findOrFail($customer->id);
        $model->update($this->mapper->toAttributes($customer));
        $model->refresh();
        return $this->mapper->toDomain($model);
    }

    public function delete(int $id): void
    {
        CustomerModel::where('Id', $id)->update(['IsActive' => 0]);
    }

    public function getStats(): array
    {
        $result = CustomerModel::selectRaw(
            'COUNT(*) as total_customers, SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as active_customers'
        )->first();

        return [
            'total_customers'  => (int) $result->total_customers,
            'active_customers' => (int) $result->active_customers,
        ];
    }
}
