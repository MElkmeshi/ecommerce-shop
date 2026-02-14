<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVariantTypeRequest extends FormRequest
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
        $variantTypeId = $this->route('id');

        return [
            'name' => 'sometimes|required|array',
            'name.en' => 'sometimes|required|string|max:255',
            'name.ar' => 'sometimes|required|string|max:255',
            'slug' => "nullable|string|max:255|unique:variant_types,slug,{$variantTypeId}",
            'values' => 'nullable|array',
            'values.*.value' => 'required|array',
            'values.*.value.en' => 'required|string|max:255',
            'values.*.value.ar' => 'required|string|max:255',
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
            'name.en.required' => 'The English name is required.',
            'name.ar.required' => 'The Arabic name is required.',
            'slug.unique' => 'This slug is already in use.',
            'values.*.value.en.required' => 'Each value must have an English translation.',
            'values.*.value.ar.required' => 'Each value must have an Arabic translation.',
        ];
    }
}
