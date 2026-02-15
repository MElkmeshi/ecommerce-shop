<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class AppSettings extends Settings
{
    // Delivery Fee Settings
    public float $base_delivery_fee;

    public float $delivery_distance_threshold_km;

    public float $extra_fee_per_km;

    public float $max_delivery_distance_km;

    // Payment Settings
    public bool $credit_card_enabled;

    public float $credit_card_charge_percentage;

    // Store Location
    public float $store_latitude;

    public float $store_longitude;

    // Google Maps API
    public ?string $google_maps_api_key;

    public static function group(): string
    {
        return 'app';
    }
}
