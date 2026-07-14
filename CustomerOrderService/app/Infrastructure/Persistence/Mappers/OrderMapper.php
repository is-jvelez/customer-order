<?php

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\ValueObjects\OrderStatus;
use App\Infrastructure\Persistence\Models\OrderItemModel;
use App\Infrastructure\Persistence\Models\OrderModel;

class OrderMapper
{
    public function toDomain(OrderModel $model): Order
    {
        $items = $model->relationLoaded('items')
            ? $model->items->map(fn(OrderItemModel $i) => $this->itemToDomain($i))->all()
            : [];

        return new Order(
            id:         $model->Id,
            customerId: $model->CustomerId,
            status:     OrderStatus::from($model->Status),
            total:      (float) $model->Total,
            notes:      $model->Notes,
            createdAt:  $model->CreatedAt,
            updatedAt:  $model->UpdatedAt,
            items:      $items,
        );
    }

    public function itemToDomain(OrderItemModel $model): OrderItem
    {
        return new OrderItem(
            id:          $model->Id,
            orderId:     $model->OrderId,
            description: $model->Description,
            quantity:    (int) $model->Quantity,
            unitPrice:   (float) $model->UnitPrice,
        );
    }
}
