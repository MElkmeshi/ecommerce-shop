<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
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
            // Delivery Fee Settings
            'base_delivery_fee' => 'sometimes|numeric|min:0',
            'delivery_distance_threshold_km' => 'sometimes|numeric|min:0',
            'extra_fee_per_km' => 'sometimes|numeric|min:0',
            'max_delivery_distance_km' => 'sometimes|numeric|min:0',

            // Payment Settings
            'credit_card_charge_percentage' => 'sometimes|numeric|min:0|max:100',

            // Store Location
            'store_latitude' => 'sometimes|numeric|min:-90|max:90',
            'store_longitude' => 'sometimes|numeric|min:-180|max:180',

            // Google Maps API
            'google_maps_api_key' => 'sometimes|nullable|string|max:255',
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
            'base_delivery_fee' => 'base delivery fee',
            'delivery_distance_threshold_km' => 'delivery distance threshold',
            'extra_fee_per_km' => 'extra fee per kilometer',
            'max_delivery_distance_km' => 'maximum delivery distance',
            'credit_card_charge_percentage' => 'credit card charge percentage',
            'store_latitude' => 'store latitude',
            'store_longitude' => 'store longitude',
            'google_maps_api_key' => 'Google Maps API key',
        ];
    }
}
