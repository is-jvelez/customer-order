<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id'             => ['required', 'integer', 'min:1'],
            'notes'                   => ['sometimes', 'nullable', 'string', 'max:500'],
            'priority'                => ['sometimes', 'nullable', 'integer', 'in:1,2,3'],
            'items'                   => ['required', 'array', 'min:1'],
            'items.*.description'     => ['required', 'string', 'max:300'],
            'items.*.quantity'        => ['required', 'integer', 'min:1'],
            'items.*.unit_price'      => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required'        => 'El ID del cliente es obligatorio.',
            'priority.integer'            => 'La prioridad debe ser un número entero.',
            'priority.in'                 => 'La prioridad debe ser 1 (Baja), 2 (Media) o 3 (Alta).',
            'items.required'              => 'Debe incluir al menos un ítem.',
            'items.min'                   => 'Debe incluir al menos un ítem.',
            'items.*.description.required'=> 'Cada ítem debe tener descripción.',
            'items.*.quantity.required'   => 'Cada ítem debe tener cantidad.',
            'items.*.quantity.min'        => 'La cantidad debe ser mayor a 0.',
            'items.*.unit_price.required' => 'Cada ítem debe tener precio unitario.',
            'items.*.unit_price.min'      => 'El precio unitario no puede ser negativo.',
        ];
    }
}
