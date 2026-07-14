<?php

namespace Tests\Feature\Integration;

use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use App\Infrastructure\Persistence\Repositories\EloquentCustomerRepository;
use Tests\Support\Database\UsesCustomerOrderSqliteSchema;
use Tests\TestCase;

class EloquentCustomerRepositoryIntegrationTest extends TestCase
{
    use UsesCustomerOrderSqliteSchema;

    private EloquentCustomerRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCustomerOrderSqliteSchema();
        $this->repository = $this->app->make(EloquentCustomerRepository::class);
    }

    public function test_CreateAndFind_ShouldPersistAndRetrieveCustomer_WhenDataIsValid(): void
    {
        $created = $this->repository->create($this->makeCustomerEntity(
            id: null,
            name: 'Alice',
            email: 'alice@example.com',
            phone: '111',
            address: 'Main',
            isActive: true,
        ));

        $byId = $this->repository->findById((int) $created->id);
        $byEmail = $this->repository->findByEmail('ALICE@example.com');

        $this->assertNotNull($created->id);
        $this->assertNotNull($byId);
        $this->assertNotNull($byEmail);
        $this->assertSame('alice@example.com', $byEmail->email->value);
    }

    public function test_Update_ShouldPersistChanges_WhenCustomerExists(): void
    {
        $created = $this->repository->create($this->makeCustomerEntity(
            id: null,
            name: 'Name',
            email: 'name@example.com',
            phone: '123',
            address: 'Address',
            isActive: true,
        ));

        $updated = $this->repository->update($this->makeCustomerEntity(
            id: (int) $created->id,
            name: 'New Name',
            email: 'new@example.com',
            phone: '999',
            address: 'New Address',
            isActive: true,
        ));

        $this->assertSame('New Name', $updated->name);
        $this->assertSame('new@example.com', $updated->email->value);
        $this->assertSame('999', $updated->phone);
    }

    public function test_DeleteAndStats_ShouldSoftDisableCustomerAndReturnAggregates_WhenCalled(): void
    {
        $a = $this->repository->create($this->makeCustomerEntity(
            id: null,
            name: 'A',
            email: 'a@example.com',
            phone: null,
            address: null,
            isActive: true,
        ));
        $this->repository->create($this->makeCustomerEntity(
            id: null,
            name: 'B',
            email: 'b@example.com',
            phone: null,
            address: null,
            isActive: true,
        ));

        $this->repository->delete((int) $a->id);
        $stats = $this->repository->getStats();

        $this->assertSame(2, $stats['total_customers']);
        $this->assertSame(1, $stats['active_customers']);
    }

    private function makeCustomerEntity(
        ?int $id,
        string $name,
        string $email,
        ?string $phone,
        ?string $address,
        bool $isActive,
    ): Customer {
        return new Customer(
            id: $id,
            name: $name,
            email: new CustomerEmail($email),
            phone: $phone,
            address: $address,
            isActive: $isActive,
            createdAt: null,
        );
    }
}

