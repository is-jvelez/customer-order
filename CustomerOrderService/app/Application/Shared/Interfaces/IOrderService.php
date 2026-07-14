<?php

namespace App\Application\Shared\Interfaces;

use App\Application\Orders\DTOs\CreateOrderDTO;
use App\Application\Orders\DTOs\UpdateOrderDTO;
use App\Domain\Orders\Entities\Order;

interface IOrderService
{
    /**
     * @param  array{status?:string, customer_id?:int, date_from?:string, date_to?:string, per_page?:int, page?:int} $filters
     * @return array{items: Order[], pagination: array}
     */
    public function getAll(array $filters = []): array;

    public function getById(int $id): Order;

    public function create(CreateOrderDTO $dto): Order;

    public function update(int $id, UpdateOrderDTO $dto): Order;

    public function complete(int $id): Order;

    public function cancel(int $id): Order;

    public function delete(int $id): void;

    public function getOrderStats(): array;

    /** @return array<array{date: string, count: int, total: float}> */
    public function getOrdersByDay(): array;

    /** @return array<array{date: string, count: int, total: float}> */
    public function getOrdersByMonth(): array;
}
