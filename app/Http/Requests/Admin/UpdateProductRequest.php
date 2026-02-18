<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
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
            'name' => 'sometimes|array',
            'name.en' => 'sometimes|string|max:255',
            'name.ar' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|array',
            'description.en' => 'nullable|string',
            'description.ar' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'categoryId' => 'sometimes|integer|exists:categories,id',
            'brandId' => 'nullable|integer|exists:brands,id',
            'image' => 'nullable|image|max:5120', // Max 5MB
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name.en' => 'English name',
            'name.ar' => 'Arabic name',
            'description.en' => 'English description',
            'description.ar' => 'Arabic description',
            'categoryId' => 'category',
            'brandId' => 'brand',
        ];
    }
}
