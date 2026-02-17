<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateVariantTypeRequest extends FormRequest
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
            'name' => 'required|array',
            'name.en' => 'required|string|max:255',
            'name.ar' => 'required|string|max:255',
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
            'name.required' => 'The variant type name is required.',
            'name.en.required' => 'The English name is required.',
            'name.ar.required' => 'The Arabic name is required.',
            'values.*.value.en.required' => 'Each value must have an English translation.',
            'values.*.value.ar.required' => 'Each value must have an Arabic translation.',
        ];
    }
}
