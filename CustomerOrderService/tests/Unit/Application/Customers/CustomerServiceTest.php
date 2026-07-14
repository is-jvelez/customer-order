<?php

namespace Tests\Unit\Application\Customers;

use App\Application\Customers\DTOs\CreateCustomerDTO;
use App\Application\Customers\DTOs\UpdateCustomerDTO;
use App\Application\Customers\Services\CustomerService;
use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Exceptions\DuplicateEmailException;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use PHPUnit\Framework\TestCase;

class CustomerServiceTest extends TestCase
{
    private ICustomerRepository $repository;
    private CustomerService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->createMock(ICustomerRepository::class);
        $this->service = new CustomerService($this->repository);
    }

    public function test_GetById_ShouldThrowException_WhenCustomerDoesNotExist(): void
    {
        $this->repository->expects($this->once())
            ->method('findById')
            ->with(999)
            ->willReturn(null);

        $this->expectException(CustomerNotFoundException::class);

        $this->service->getById(999);
    }

    public function test_Create_ShouldThrowException_WhenEmailAlreadyExists(): void
    {
        $dto = new CreateCustomerDTO('John', 'john@example.com');

        $this->repository->expects($this->once())
            ->method('findByEmail')
            ->with('john@example.com')
            ->willReturn($this->makeCustomer(id: 1, email: 'john@example.com'));

        $this->expectException(DuplicateEmailException::class);

        $this->service->create($dto);
    }

    public function test_Create_ShouldPersistNewCustomer_WhenEmailIsUnique(): void
    {
        $dto = new CreateCustomerDTO('John', 'JOHN@example.com', '777', 'Address');

        $this->repository->expects($this->once())
            ->method('findByEmail')
            ->with('JOHN@example.com')
            ->willReturn(null);

        $this->repository->expects($this->once())
            ->method('create')
            ->with($this->callback(function (Customer $customer): bool {
                return $customer->id === null
                    && $customer->name === 'John'
                    && $customer->email->value === 'john@example.com'
                    && $customer->phone === '777'
                    && $customer->address === 'Address'
                    && $customer->isActive === true;
            }))
            ->willReturn($this->makeCustomer(id: 25, email: 'john@example.com'));

        $created = $this->service->create($dto);

        $this->assertSame(25, $created->id);
        $this->assertSame('john@example.com', $created->email->value);
    }

    public function test_Update_ShouldThrowException_WhenCustomerDoesNotExist(): void
    {
        $this->repository->expects($this->once())
            ->method('findById')
            ->with(15)
            ->willReturn(null);

        $this->expectException(CustomerNotFoundException::class);

        $this->service->update(15, new UpdateCustomerDTO(name: 'Updated'));
    }

    public function test_Update_ShouldThrowException_WhenNewEmailAlreadyExists(): void
    {
        $existing = $this->makeCustomer(id: 4, email: 'existing@example.com');

        $this->repository->expects($this->once())
            ->method('findById')
            ->with(4)
            ->willReturn($existing);

        $this->repository->expects($this->once())
            ->method('findByEmail')
            ->with('duplicated@example.com')
            ->willReturn($this->makeCustomer(id: 8, email: 'duplicated@example.com'));

        $this->expectException(DuplicateEmailException::class);

        $this->service->update(4, new UpdateCustomerDTO(email: 'duplicated@example.com'));
    }

    public function test_Update_ShouldPersistMergedValues_WhenInputIsValid(): void
    {
        $existing = $this->makeCustomer(
            id: 9,
            name: 'Old Name',
            email: 'old@example.com',
            phone: '123',
            address: 'Old Address',
        );

        $dto = new UpdateCustomerDTO(name: 'New Name', email: 'new@example.com', address: 'New Address');

        $this->repository->expects($this->once())
            ->method('findById')
            ->with(9)
            ->willReturn($existing);

        $this->repository->expects($this->once())
            ->method('findByEmail')
            ->with('new@example.com')
            ->willReturn(null);

        $this->repository->expects($this->once())
            ->method('update')
            ->with($this->callback(function (Customer $updated): bool {
                return $updated->id === 9
                    && $updated->name === 'New Name'
                    && $updated->email->value === 'new@example.com'
                    && $updated->phone === '123'
                    && $updated->address === 'New Address';
            }))
            ->willReturn($this->makeCustomer(
                id: 9,
                name: 'New Name',
                email: 'new@example.com',
                phone: '123',
                address: 'New Address',
            ));

        $result = $this->service->update(9, $dto);

        $this->assertSame('New Name', $result->name);
        $this->assertSame('new@example.com', $result->email->value);
        $this->assertSame('123', $result->phone);
    }

    public function test_Delete_ShouldThrowException_WhenCustomerDoesNotExist(): void
    {
        $this->repository->expects($this->once())
            ->method('findById')
            ->with(123)
            ->willReturn(null);

        $this->repository->expects($this->never())->method('delete');

        $this->expectException(CustomerNotFoundException::class);

        $this->service->delete(123);
    }

    public function test_Delete_ShouldCallRepository_WhenCustomerExists(): void
    {
        $this->repository->expects($this->once())
            ->method('findById')
            ->with(7)
            ->willReturn($this->makeCustomer(id: 7, email: 'seven@example.com'));

        $this->repository->expects($this->once())
            ->method('delete')
            ->with(7);

        $this->service->delete(7);

        $this->assertTrue(true);
    }

    public function test_GetCustomerStats_ShouldReturnRepositoryStats_WhenCalled(): void
    {
        $expected = ['total_customers' => 10, 'active_customers' => 9];

        $this->repository->expects($this->once())
            ->method('getStats')
            ->willReturn($expected);

        $this->assertSame($expected, $this->service->getCustomerStats());
    }

    private function makeCustomer(
        int $id,
        string $name = 'Customer',
        string $email = 'customer@example.com',
        ?string $phone = null,
        ?string $address = null,
    ): Customer {
        return new Customer(
            id: $id,
            name: $name,
            email: new CustomerEmail($email),
            phone: $phone,
            address: $address,
            isActive: true,
            createdAt: '2026-01-01 00:00:00',
        );
    }
}

