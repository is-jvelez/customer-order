<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class CreateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => ['required', 'string', 'max:150'],
            'email'   => ['required', 'email',  'max:150'],
            'phone'   => ['sometimes', 'nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'string', 'max:300'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'El nombre es obligatorio.',
            'email.required' => 'El email es obligatorio.',
            'email.email'    => 'El email no tiene un formato válido.',
        ];
    }
}
