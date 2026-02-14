<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateVariantsRequest extends FormRequest
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
            'combinations' => 'required|array|min:1',
            'combinations.*.variant_value_ids' => 'required|array|min:1',
            'combinations.*.variant_value_ids.*' => 'required|integer|exists:variant_values,id',
            'combinations.*.price' => 'required|numeric|min:0',
            'combinations.*.stock' => 'nullable|integer|min:0',
            'combinations.*.sku' => 'nullable|string|max:255|unique:product_variants,sku',
            'combinations.*.is_default' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'combinations.required' => 'At least one variant combination is required.',
            'combinations.*.variant_value_ids.required' => 'Variant values are required for each combination.',
            'combinations.*.variant_value_ids.*.exists' => 'Invalid variant value selected.',
            'combinations.*.price.required' => 'Price is required for each variant.',
            'combinations.*.price.min' => 'Price must be at least 0.',
            'combinations.*.sku.unique' => 'This SKU is already in use.',
        ];
    }
}
