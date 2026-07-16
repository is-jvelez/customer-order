<?php

namespace App\Domain\Orders\Interfaces;

use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;

interface IOrderRepository
{
    /**
     * @param  array{status?:string, customer_id?:int, date_from?:string, date_to?:string, priority?:int, per_page?:int, page?:int} $filters
     * @return array{items: Order[], pagination: array}
     */
    public function findAll(array $filters = []): array;

    public function findById(int $id): ?Order;

    /** @param OrderItem[] $items */
    public function create(Order $order, array $items): Order;

    public function update(Order $order): Order;

    public function delete(int $id): void;

    public function getStats(): array;

    /** @return array<array{date: string, count: int, total: float}> */
    public function getOrdersByDay(): array;

    /** @return array<array{date: string, count: int, total: float}> */
    public function getOrdersByMonth(): array;
}
