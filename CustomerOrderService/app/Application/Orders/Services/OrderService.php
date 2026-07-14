<?php

namespace App\Application\Orders\Services;

use App\Application\Orders\DTOs\CreateOrderDTO;
use App\Application\Orders\DTOs\OrderItemDTO;
use App\Application\Orders\DTOs\UpdateOrderDTO;
use App\Application\Shared\Interfaces\IOrderService;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Interfaces\ICustomerRepository;
use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\Exceptions\InvalidOrderStatusException;
use App\Domain\Orders\Exceptions\OrderNotFoundException;
use App\Domain\Orders\Interfaces\IOrderRepository;
use App\Domain\Orders\ValueObjects\OrderStatus;

class OrderService implements IOrderService
{
    public function __construct(
        private readonly IOrderRepository    $orderRepository,
        private readonly ICustomerRepository $customerRepository,
    ) {}

    public function getAll(array $filters = []): array
    {
        return $this->orderRepository->findAll($filters);
    }

    public function getById(int $id): Order
    {
        $order = $this->orderRepository->findById($id);
        if ($order === null) {
            throw new OrderNotFoundException($id);
        }
        return $order;
    }

    public function create(CreateOrderDTO $dto): Order
    {
        $customer = $this->customerRepository->findById($dto->customerId);
        if ($customer === null) {
            throw new CustomerNotFoundException($dto->customerId);
        }

        $order = new Order(
            id:         null,
            customerId: $dto->customerId,
            status:     OrderStatus::Pending,
            total:      0.0,
            notes:      $dto->notes,
            createdAt:  null,
            updatedAt:  null,
            items:      [],
        );

        $items = array_map(
            fn(OrderItemDTO $itemDto) => new OrderItem(
                id:          null,
                orderId:     null,
                description: $itemDto->description,
                quantity:    $itemDto->quantity,
                unitPrice:   $itemDto->unitPrice,
            ),
            $dto->items,
        );

        return $this->orderRepository->create($order, $items);
    }

    public function update(int $id, UpdateOrderDTO $dto): Order
    {
        $order = $this->orderRepository->findById($id);
        if ($order === null) {
            throw new OrderNotFoundException($id);
        }

        $updated = new Order(
            id:         $order->id,
            customerId: $order->customerId,
            status:     $order->status,
            total:      $order->total,
            notes:      $dto->notes ?? $order->notes,
            createdAt:  $order->createdAt,
            updatedAt:  $order->updatedAt,
            items:      $order->items,
        );

        return $this->orderRepository->update($updated);
    }

    public function complete(int $id): Order
    {
        return $this->changeStatus($id, OrderStatus::Completed);
    }

    public function cancel(int $id): Order
    {
        return $this->changeStatus($id, OrderStatus::Cancelled);
    }

    private function changeStatus(int $id, OrderStatus $newStatus): Order
    {
        $order = $this->orderRepository->findById($id);
        if ($order === null) {
            throw new OrderNotFoundException($id);
        }

        if (!$order->status->canTransitionTo($newStatus)) {
            throw new InvalidOrderStatusException($order->status->value, $newStatus->value);
        }

        return $this->orderRepository->update(new Order(
            id:         $order->id,
            customerId: $order->customerId,
            status:     $newStatus,
            total:      $order->total,
            notes:      $order->notes,
            createdAt:  $order->createdAt,
            updatedAt:  $order->updatedAt,
            items:      $order->items,
        ));
    }

    public function delete(int $id): void
    {
        $order = $this->orderRepository->findById($id);
        if ($order === null) {
            throw new OrderNotFoundException($id);
        }
        $this->orderRepository->delete($id);
    }

    public function getOrderStats(): array
    {
        return $this->orderRepository->getStats();
    }

    public function getOrdersByDay(): array
    {
        return $this->orderRepository->getOrdersByDay();
    }

    public function getOrdersByMonth(): array
    {
        return $this->orderRepository->getOrdersByMonth();
    }
}
