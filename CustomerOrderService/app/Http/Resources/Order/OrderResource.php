<?php

namespace App\Http\Resources\Order;

use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Order $order */
        $order = $this->resource;

        return [
            'id'          => $order->id,
            'customer_id' => $order->customerId,
            'status'      => $order->status->value,
            'priority'    => $order->priority->value,
            'total'       => $order->total,
            'notes'       => $order->notes,
            'created_at'  => $order->createdAt,
            'updated_at'  => $order->updatedAt,
            'items'       => array_map(
                fn(OrderItem $item) => [
                    'id'          => $item->id,
                    'description' => $item->description,
                    'quantity'    => $item->quantity,
                    'unit_price'  => $item->unitPrice,
                ],
                $order->items,
            ),
        ];
    }
}
