<?php

namespace App\Http\Resources\Customer;

use App\Domain\Customers\Entities\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Customer $customer */
        $customer = $this->resource;

        return [
            'id'         => $customer->id,
            'name'       => $customer->name,
            'email'      => (string) $customer->email,
            'phone'      => $customer->phone,
            'address'    => $customer->address,
            'is_active'  => $customer->isActive,
            'created_at' => $customer->createdAt,
        ];
    }
}
