<?php

namespace Tests\Unit\Http\Resources;

use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Http\Resources\Customer\CustomerCollection;
use App\Http\Resources\Customer\CustomerResource;
use App\Http\Resources\Order\OrderCollection;
use App\Http\Resources\Order\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class ResourceTransformationTest extends TestCase
{
    public function test_CustomerResource_ShouldTransformDomainEntity_WhenToArrayIsCalled(): void
    {
        $customer = new Customer(
            id: 1,
            name: 'Jane',
            email: new CustomerEmail('jane@example.com'),
            phone: '111',
            address: 'Street',
            isActive: true,
            createdAt: '2026-01-01 12:00:00',
        );

        $resource = new CustomerResource($customer);
        $array = $resource->toArray(Request::create('/'));

        $this->assertSame(1, $array['id']);
        $this->assertSame('jane@example.com', $array['email']);
        $this->assertTrue($array['is_active']);
    }

    public function test_CustomerCollection_ShouldTransformCollection_WhenToArrayIsCalled(): void
    {
        $customers = new Collection([
            ['id' => 1, 'email' => 'a@example.com'],
            ['id' => 2, 'email' => 'b@example.com'],
        ]);

        $collection = new CustomerCollection($customers);
        $array = $collection->toArray(Request::create('/'));

        $this->assertCount(2, $array);
        $this->assertSame('a@example.com', $array[0]['email']);
    }

    public function test_OrderResourceAndCollection_ShouldTransformOrderWithItems_WhenToArrayIsCalled(): void
    {
        $order = new Order(
            id: 9,
            customerId: 3,
            status: OrderStatus::Completed,
            total: 40.0,
            notes: 'ok',
            createdAt: '2026-01-01 00:00:00',
            updatedAt: '2026-01-01 00:10:00',
            items: [
                new OrderItem(11, 9, 'USB Cable', 2, 10.0),
                new OrderItem(12, 9, 'Adapter', 1, 20.0),
            ],
        );

        $resourceArray = (new OrderResource($order))->toArray(Request::create('/'));
        $collectionArray = (new OrderCollection(new Collection([
            ['id' => 9, 'status' => 'Completed'],
        ])))->toArray(Request::create('/'));

        $this->assertSame('Completed', $resourceArray['status']);
        $this->assertCount(2, $resourceArray['items']);
        $this->assertSame('USB Cable', $resourceArray['items'][0]['description']);
        $this->assertCount(1, $collectionArray);
        $this->assertSame(9, $collectionArray[0]['id']);
    }
}
