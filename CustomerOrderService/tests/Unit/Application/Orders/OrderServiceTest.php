<?php

namespace Tests\Unit\Application\Orders;

use App\Application\Orders\DTOs\CreateOrderDTO;
use App\Application\Orders\DTOs\OrderItemDTO;
use App\Application\Orders\DTOs\UpdateOrderDTO;
use App\Application\Orders\Services\OrderService;
use App\Domain\Customers\Entities\Customer;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Domain\Customers\ValueObjects\CustomerEmail;
use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\Exceptions\InvalidOrderStatusException;
use App\Domain\Orders\Exceptions\OrderNotFoundException;
use App\Domain\Orders\Interfaces\IOrderRepository;
use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Enums\OrderPriority;
use PHPUnit\Framework\TestCase;

class OrderServiceTest extends TestCase
{
    private IOrderRepository $orderRepository;
    private ICustomerRepository $customerRepository;
    private OrderService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orderRepository = $this->createMock(IOrderRepository::class);
        $this->customerRepository = $this->createMock(ICustomerRepository::class);
        $this->service = new OrderService($this->orderRepository, $this->customerRepository);
    }

    public function test_GetById_ShouldThrowException_WhenOrderDoesNotExist(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(404)
            ->willReturn(null);

        $this->expectException(OrderNotFoundException::class);

        $this->service->getById(404);
    }

    public function test_Create_ShouldThrowException_WhenCustomerDoesNotExist(): void
    {
        $dto = new CreateOrderDTO(
            customerId: 55,
            items: [new OrderItemDTO('Book', 1, 9.5)],
        );

        $this->customerRepository->expects($this->once())
            ->method('findById')
            ->with(55)
            ->willReturn(null);

        $this->expectException(CustomerNotFoundException::class);

        $this->service->create($dto);
    }

    public function test_Create_ShouldMapItemsAndPersistOrder_WhenInputIsValid(): void
    {
        $dto = new CreateOrderDTO(
            customerId: 3,
            items: [
                new OrderItemDTO('Mouse', 2, 15.0),
                new OrderItemDTO('Keyboard', 1, 35.0),
            ],
            notes: 'Office',
        );

        $this->customerRepository->expects($this->once())
            ->method('findById')
            ->with(3)
            ->willReturn($this->makeCustomer(3));

        $this->orderRepository->expects($this->once())
            ->method('create')
            ->with(
                $this->callback(function (Order $order): bool {
                    return $order->id === null
                        && $order->customerId === 3
                        && $order->status === OrderStatus::Pending
                        && $order->notes === 'Office';
                }),
                $this->callback(function (array $items): bool {
                    return count($items) === 2
                        && $items[0] instanceof OrderItem
                        && $items[0]->description === 'Mouse'
                        && $items[0]->quantity === 2
                        && $items[0]->unitPrice === 15.0
                        && $items[1]->description === 'Keyboard';
                }),
            )
            ->willReturn($this->makeOrder(id: 10, status: OrderStatus::Pending, notes: 'Office'));

        $created = $this->service->create($dto);

        $this->assertSame(10, $created->id);
        $this->assertSame(OrderStatus::Pending, $created->status);
        $this->assertSame('Office', $created->notes);
    }

    public function test_Create_ShouldDefaultPriorityToMedium_WhenDtoPriorityIsNull(): void
    {
        $dto = new CreateOrderDTO(
            customerId: 3,
            items: [new OrderItemDTO('Mouse', 1, 10.0)],
        );

        $this->customerRepository->expects($this->once())
            ->method('findById')
            ->with(3)
            ->willReturn($this->makeCustomer(3));

        $this->orderRepository->expects($this->once())
            ->method('create')
            ->with(
                $this->callback(fn(Order $order): bool => $order->priority === OrderPriority::Medium),
                $this->anything(),
            )
            ->willReturn($this->makeOrder(id: 11, status: OrderStatus::Pending));

        $this->service->create($dto);
    }

    public function test_Create_ShouldUseProvidedPriority_WhenDtoPriorityIsGiven(): void
    {
        $dto = new CreateOrderDTO(
            customerId: 3,
            items: [new OrderItemDTO('Mouse', 1, 10.0)],
            priority: 3,
        );

        $this->customerRepository->expects($this->once())
            ->method('findById')
            ->with(3)
            ->willReturn($this->makeCustomer(3));

        $this->orderRepository->expects($this->once())
            ->method('create')
            ->with(
                $this->callback(fn(Order $order): bool => $order->priority === OrderPriority::High),
                $this->anything(),
            )
            ->willReturn($this->makeOrder(id: 12, status: OrderStatus::Pending));

        $this->service->create($dto);
    }

    public function test_Update_ShouldThrowException_WhenOrderDoesNotExist(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(100)
            ->willReturn(null);

        $this->expectException(OrderNotFoundException::class);

        $this->service->update(100, new UpdateOrderDTO(notes: 'n'));
    }

    public function test_Update_ShouldPersistNotes_WhenOrderExists(): void
    {
        $existing = $this->makeOrder(id: 2, status: OrderStatus::Pending, notes: 'Old');

        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(2)
            ->willReturn($existing);

        $this->orderRepository->expects($this->once())
            ->method('update')
            ->with($this->callback(function (Order $updated): bool {
                return $updated->id === 2 && $updated->notes === 'New Note';
            }))
            ->willReturn($this->makeOrder(id: 2, status: OrderStatus::Pending, notes: 'New Note'));

        $result = $this->service->update(2, new UpdateOrderDTO(notes: 'New Note'));

        $this->assertSame('New Note', $result->notes);
    }

    public function test_Update_ShouldRetainExistingPriority_WhenDtoPriorityIsNull(): void
    {
        $existing = $this->makeOrder(id: 2, status: OrderStatus::Pending, priority: OrderPriority::High);

        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(2)
            ->willReturn($existing);

        $this->orderRepository->expects($this->once())
            ->method('update')
            ->with($this->callback(fn(Order $updated): bool => $updated->priority === OrderPriority::High))
            ->willReturn($this->makeOrder(id: 2, status: OrderStatus::Pending, priority: OrderPriority::High));

        $result = $this->service->update(2, new UpdateOrderDTO(notes: 'unchanged priority'));

        $this->assertSame(OrderPriority::High, $result->priority);
    }

    public function test_Update_ShouldChangePriority_WhenDtoPriorityIsGiven(): void
    {
        $existing = $this->makeOrder(id: 2, status: OrderStatus::Pending, priority: OrderPriority::Medium);

        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(2)
            ->willReturn($existing);

        $this->orderRepository->expects($this->once())
            ->method('update')
            ->with($this->callback(fn(Order $updated): bool => $updated->priority === OrderPriority::Low))
            ->willReturn($this->makeOrder(id: 2, status: OrderStatus::Pending, priority: OrderPriority::Low));

        $result = $this->service->update(2, new UpdateOrderDTO(priority: 1));

        $this->assertSame(OrderPriority::Low, $result->priority);
    }

    public function test_Complete_ShouldThrowException_WhenTransitionIsInvalid(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(1)
            ->willReturn($this->makeOrder(id: 1, status: OrderStatus::Completed));

        $this->expectException(InvalidOrderStatusException::class);

        $this->service->complete(1);
    }

    public function test_Complete_ShouldUpdateStatus_WhenTransitionIsValid(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(6)
            ->willReturn($this->makeOrder(id: 6, status: OrderStatus::InProgress));

        $this->orderRepository->expects($this->once())
            ->method('update')
            ->with($this->callback(fn(Order $o): bool => $o->id === 6 && $o->status === OrderStatus::Completed))
            ->willReturn($this->makeOrder(id: 6, status: OrderStatus::Completed));

        $result = $this->service->complete(6);

        $this->assertSame(OrderStatus::Completed, $result->status);
    }

    public function test_Complete_ShouldPreserveExistingPriority_WhenStatusChanges(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(6)
            ->willReturn($this->makeOrder(id: 6, status: OrderStatus::InProgress, priority: OrderPriority::High));

        $this->orderRepository->expects($this->once())
            ->method('update')
            ->with($this->callback(fn(Order $o): bool => $o->priority === OrderPriority::High))
            ->willReturn($this->makeOrder(id: 6, status: OrderStatus::Completed, priority: OrderPriority::High));

        $result = $this->service->complete(6);

        $this->assertSame(OrderPriority::High, $result->priority);
    }

    public function test_Cancel_ShouldThrowException_WhenTransitionIsInvalid(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(3)
            ->willReturn($this->makeOrder(id: 3, status: OrderStatus::Completed));

        $this->expectException(InvalidOrderStatusException::class);

        $this->service->cancel(3);
    }

    public function test_Cancel_ShouldUpdateStatus_WhenTransitionIsValid(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(8)
            ->willReturn($this->makeOrder(id: 8, status: OrderStatus::Pending));

        $this->orderRepository->expects($this->once())
            ->method('update')
            ->with($this->callback(fn(Order $o): bool => $o->id === 8 && $o->status === OrderStatus::Cancelled))
            ->willReturn($this->makeOrder(id: 8, status: OrderStatus::Cancelled));

        $result = $this->service->cancel(8);

        $this->assertSame(OrderStatus::Cancelled, $result->status);
    }

    public function test_Delete_ShouldThrowException_WhenOrderDoesNotExist(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(77)
            ->willReturn(null);

        $this->orderRepository->expects($this->never())->method('delete');

        $this->expectException(OrderNotFoundException::class);

        $this->service->delete(77);
    }

    public function test_Delete_ShouldCallRepository_WhenOrderExists(): void
    {
        $this->orderRepository->expects($this->once())
            ->method('findById')
            ->with(5)
            ->willReturn($this->makeOrder(id: 5, status: OrderStatus::Pending));

        $this->orderRepository->expects($this->once())
            ->method('delete')
            ->with(5);

        $this->service->delete(5);

        $this->assertTrue(true);
    }

    public function test_StatsMethods_ShouldDelegateToRepository_WhenCalled(): void
    {
        $stats = ['total_orders' => 2];
        $byDay = [['date' => '2026-01-01', 'count' => 1, 'total' => 10.0]];
        $byMonth = [['date' => '2026-01', 'count' => 2, 'total' => 20.0]];

        $this->orderRepository->expects($this->once())->method('getStats')->willReturn($stats);
        $this->orderRepository->expects($this->once())->method('getOrdersByDay')->willReturn($byDay);
        $this->orderRepository->expects($this->once())->method('getOrdersByMonth')->willReturn($byMonth);

        $this->assertSame($stats, $this->service->getOrderStats());
        $this->assertSame($byDay, $this->service->getOrdersByDay());
        $this->assertSame($byMonth, $this->service->getOrdersByMonth());
    }

    private function makeCustomer(int $id): Customer
    {
        return new Customer(
            id: $id,
            name: 'Customer '.$id,
            email: new CustomerEmail("customer{$id}@example.com"),
            phone: null,
            address: null,
            isActive: true,
            createdAt: '2026-01-01 00:00:00',
        );
    }

    private function makeOrder(int $id, OrderStatus $status, ?string $notes = null, OrderPriority $priority = OrderPriority::Medium): Order
    {
        return new Order(
            id: $id,
            customerId: 1,
            status: $status,
            total: 100.0,
            notes: $notes,
            createdAt: '2026-01-01 00:00:00',
            updatedAt: '2026-01-01 01:00:00',
            items: [],
            priority: $priority,
        );
    }
}

