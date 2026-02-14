<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phoneNumber' => ['required', 'string', 'regex:/^0\d{9,10}$/'],
            'location' => 'required|array',
            'location.latitude' => 'required_without:location.address|numeric',
            'location.longitude' => 'required_without:location.address|numeric',
            'location.address' => 'required_without:location.latitude|string',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|integer|exists:products,id',
            'items.*.productVariantId' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phoneNumber.regex' => 'Phone number must start with 0 and be 10-11 digits long.',
            'items.required' => 'At least one item is required in the order.',
            'items.*.productId.exists' => 'One or more products do not exist.',
        ];
    }
}
