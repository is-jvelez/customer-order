<?php

namespace Tests\Feature\Integration;

use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Enums\OrderPriority;
use App\Infrastructure\Persistence\Repositories\EloquentOrderRepository;
use Illuminate\Support\Facades\DB;
use Tests\Support\Database\UsesCustomerOrderSqliteSchema;
use Tests\TestCase;

class EloquentOrderRepositoryIntegrationTest extends TestCase
{
    use UsesCustomerOrderSqliteSchema;

    private EloquentOrderRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCustomerOrderSqliteSchema();
        $this->repository = $this->app->make(EloquentOrderRepository::class);
    }

    public function test_CreateAndFindById_ShouldPersistOrderAndItems_WhenDataIsValid(): void
    {
        $customerId = $this->seedCustomer('customer-create@example.com');
        $order = new Order(
            id: null,
            customerId: $customerId,
            status: OrderStatus::Pending,
            total: 0,
            notes: 'new order',
            createdAt: null,
            updatedAt: null,
            items: [],
        );
        $items = [
            new OrderItem(null, null, 'Item A', 2, 10.0),
            new OrderItem(null, null, 'Item B', 1, 20.0),
        ];

        $created = $this->repository->create($order, $items);
        $found = $this->repository->findById((int) $created->id);

        $this->assertNotNull($created->id);
        $this->assertNotNull($found);
        $this->assertSame($customerId, $found->customerId);
        $this->assertSame(OrderStatus::Pending, $found->status);
        $this->assertCount(2, $found->items);
    }

    public function test_Create_ShouldPersistDefaultPriority_WhenOrderPriorityIsNotOverridden(): void
    {
        $customerId = $this->seedCustomer('priority-default@example.com');
        $order = new Order(
            id: null,
            customerId: $customerId,
            status: OrderStatus::Pending,
            total: 0,
            notes: 'no priority given',
            createdAt: null,
            updatedAt: null,
            items: [],
        );

        $created = $this->repository->create($order, [new OrderItem(null, null, 'Item', 1, 10.0)]);

        $this->assertSame(OrderPriority::Medium, $created->priority);
        $this->assertSame(2, DB::table('Orders')->where('Id', $created->id)->value('Priority'));
    }

    public function test_Create_ShouldPersistExplicitPriority_WhenPriorityIsHigh(): void
    {
        $customerId = $this->seedCustomer('priority-high@example.com');
        $order = new Order(
            id: null,
            customerId: $customerId,
            status: OrderStatus::Pending,
            total: 0,
            notes: 'high priority',
            createdAt: null,
            updatedAt: null,
            items: [],
            priority: OrderPriority::High,
        );

        $created = $this->repository->create($order, [new OrderItem(null, null, 'Item', 1, 10.0)]);

        $this->assertSame(OrderPriority::High, $created->priority);
        $this->assertSame(3, DB::table('Orders')->where('Id', $created->id)->value('Priority'));
    }

    public function test_FindAll_ShouldReturnOnlyHighPriorityOrders_WhenPriorityFilterIsThree(): void
    {
        $customerId = $this->seedCustomer('priority-filter@example.com');

        DB::table('Orders')->insert([
            [
                'CustomerId' => $customerId,
                'Status' => 'Pending',
                'Total' => 10,
                'Notes' => 'low',
                'CreatedAt' => now()->toDateTimeString(),
                'UpdatedAt' => now()->toDateTimeString(),
                'Priority' => 1,
            ],
            [
                'CustomerId' => $customerId,
                'Status' => 'Pending',
                'Total' => 20,
                'Notes' => 'medium',
                'CreatedAt' => now()->toDateTimeString(),
                'UpdatedAt' => now()->toDateTimeString(),
                'Priority' => 2,
            ],
            [
                'CustomerId' => $customerId,
                'Status' => 'Pending',
                'Total' => 30,
                'Notes' => 'high',
                'CreatedAt' => now()->toDateTimeString(),
                'UpdatedAt' => now()->toDateTimeString(),
                'Priority' => 3,
            ],
        ]);

        $filtered = $this->repository->findAll(['priority' => 3]);
        $all = $this->repository->findAll([]);

        $this->assertCount(1, $filtered['items']);
        $this->assertSame(OrderPriority::High, $filtered['items'][0]->priority);
        $this->assertSame('high', $filtered['items'][0]->notes);

        $this->assertCount(3, $all['items']);
    }

    public function test_FindAll_ShouldApplyFiltersAndPagination_WhenFiltersAreProvided(): void
    {
        $customerA = $this->seedCustomer('a-filters@example.com');
        $customerB = $this->seedCustomer('b-filters@example.com');

        DB::table('Orders')->insert([
            [
                'CustomerId' => $customerA,
                'Status' => 'Completed',
                'Total' => 100,
                'Notes' => 'A',
                'CreatedAt' => now()->toDateTimeString(),
                'UpdatedAt' => now()->toDateTimeString(),
            ],
            [
                'CustomerId' => $customerB,
                'Status' => 'Pending',
                'Total' => 50,
                'Notes' => 'B',
                'CreatedAt' => now()->toDateTimeString(),
                'UpdatedAt' => now()->toDateTimeString(),
            ],
        ]);

        $result = $this->repository->findAll([
            'status' => 'Completed',
            'customer_id' => $customerA,
            'per_page' => 1,
            'page' => 1,
        ]);

        $this->assertCount(1, $result['items']);
        $this->assertSame(1, $result['pagination']['total']);
        $this->assertSame('Completed', $result['items'][0]->status->value);
    }

    public function test_UpdateAndDelete_ShouldModifyAndRemoveOrder_WhenOrderExists(): void
    {
        $customerId = $this->seedCustomer('update@example.com');

        DB::table('Orders')->insert([
            'CustomerId' => $customerId,
            'Status' => 'Pending',
            'Total' => 80,
            'Notes' => 'old',
            'CreatedAt' => now()->toDateTimeString(),
            'UpdatedAt' => now()->toDateTimeString(),
        ]);
        $orderId = (int) DB::getPdo()->lastInsertId();

        $updated = $this->repository->update(new Order(
            id: $orderId,
            customerId: $customerId,
            status: OrderStatus::Completed,
            total: 80,
            notes: 'updated notes',
            createdAt: null,
            updatedAt: null,
            items: [],
        ));

        $this->assertSame('Completed', $updated->status->value);
        $this->assertSame('updated notes', $updated->notes);

        $this->repository->delete($orderId);
        $this->assertNull($this->repository->findById($orderId));
    }

    public function test_Update_ShouldChangePriority_WhenNewPriorityIsProvided(): void
    {
        $customerId = $this->seedCustomer('priority-update@example.com');

        DB::table('Orders')->insert([
            'CustomerId' => $customerId,
            'Status' => 'Pending',
            'Total' => 80,
            'Notes' => 'old',
            'CreatedAt' => now()->toDateTimeString(),
            'UpdatedAt' => now()->toDateTimeString(),
            'Priority' => 1,
        ]);
        $orderId = (int) DB::getPdo()->lastInsertId();

        $updated = $this->repository->update(new Order(
            id: $orderId,
            customerId: $customerId,
            status: OrderStatus::Pending,
            total: 80,
            notes: 'old',
            createdAt: null,
            updatedAt: null,
            items: [],
            priority: OrderPriority::High,
        ));

        $this->assertSame(OrderPriority::High, $updated->priority);
        $this->assertSame(3, DB::table('Orders')->where('Id', $orderId)->value('Priority'));
    }

    public function test_GetStatsAndOrdersByDay_ShouldReturnAggregates_WhenDataExists(): void
    {
        $customerId = $this->seedCustomer('stats@example.com');
        $now = now()->toDateTimeString();

        DB::table('Orders')->insert([
            [
                'CustomerId' => $customerId,
                'Status' => 'Completed',
                'Total' => 90,
                'Notes' => null,
                'CreatedAt' => $now,
                'UpdatedAt' => $now,
            ],
            [
                'CustomerId' => $customerId,
                'Status' => 'Pending',
                'Total' => 20,
                'Notes' => null,
                'CreatedAt' => $now,
                'UpdatedAt' => $now,
            ],
        ]);

        $stats = $this->repository->getStats();
        $byDay = $this->repository->getOrdersByDay();

        $this->assertSame(2, $stats['total_orders']);
        $this->assertSame(1, $stats['completed_orders']);
        $this->assertSame(90.0, $stats['total_revenue']);
        $this->assertNotEmpty($byDay);
        $this->assertArrayHasKey('date', $byDay[0]);
        $this->assertArrayHasKey('count', $byDay[0]);
        $this->assertArrayHasKey('total', $byDay[0]);
    }

    public function test_GetOrdersByMonth_ShouldReturnArray_WhenQueryExecutes(): void
    {
        $customerId = $this->seedCustomer('month@example.com');
        DB::table('Orders')->insert([
            'CustomerId' => $customerId,
            'Status' => 'Completed',
            'Total' => 10,
            'Notes' => null,
            'CreatedAt' => now()->toDateTimeString(),
            'UpdatedAt' => now()->toDateTimeString(),
        ]);

        $result = $this->repository->getOrdersByMonth();

        $this->assertIsArray($result);
        if (!empty($result)) {
            $this->assertArrayHasKey('date', $result[0]);
            $this->assertArrayHasKey('count', $result[0]);
            $this->assertArrayHasKey('total', $result[0]);
        }
    }

    private function seedCustomer(string $email): int
    {
        DB::table('Customers')->insert([
            'Name' => 'Customer',
            'Email' => $email,
            'Phone' => null,
            'Address' => null,
            'IsActive' => 1,
            'CreatedAt' => now()->toDateTimeString(),
        ]);

        return (int) DB::getPdo()->lastInsertId();
    }
}
