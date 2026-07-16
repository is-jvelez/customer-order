<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes'    => ['sometimes', 'nullable', 'string', 'max:500'],
            'priority' => ['sometimes', 'nullable', 'integer', 'in:1,2,3'],
        ];
    }

    public function messages(): array
    {
        return [
            'priority.integer' => 'La prioridad debe ser un número entero.',
            'priority.in'      => 'La prioridad debe ser 1 (Baja), 2 (Media) o 3 (Alta).',
        ];
    }
}
