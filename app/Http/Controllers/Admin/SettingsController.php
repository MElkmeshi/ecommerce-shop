<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Settings\AppSettings;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        private readonly AppSettings $settings
    ) {}

    /**
     * Display the settings page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/AdminSettingsPage');
    }

    /**
     * API: Get current settings.
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'settings' => [
                // Delivery Fee Settings
                'base_delivery_fee' => $this->settings->base_delivery_fee,
                'delivery_distance_threshold_km' => $this->settings->delivery_distance_threshold_km,
                'extra_fee_per_km' => $this->settings->extra_fee_per_km,
                'max_delivery_distance_km' => $this->settings->max_delivery_distance_km,

                // Payment Settings
                'credit_card_charge_percentage' => $this->settings->credit_card_charge_percentage,

                // Store Location
                'store_latitude' => $this->settings->store_latitude,
                'store_longitude' => $this->settings->store_longitude,

                // Google Maps API
                'google_maps_api_key' => $this->settings->google_maps_api_key,
            ],
        ]);
    }

    /**
     * Update settings.
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Update each setting if provided
        foreach ($validated as $key => $value) {
            $this->settings->$key = $value;
        }

        $this->settings->save();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'settings' => [
                'base_delivery_fee' => $this->settings->base_delivery_fee,
                'delivery_distance_threshold_km' => $this->settings->delivery_distance_threshold_km,
                'extra_fee_per_km' => $this->settings->extra_fee_per_km,
                'max_delivery_distance_km' => $this->settings->max_delivery_distance_km,
                'credit_card_charge_percentage' => $this->settings->credit_card_charge_percentage,
                'store_latitude' => $this->settings->store_latitude,
                'store_longitude' => $this->settings->store_longitude,
                'google_maps_api_key' => $this->settings->google_maps_api_key,
            ],
        ]);
    }
}
