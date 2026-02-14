<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Delivery Fee Settings
        $this->migrator->add('app.base_delivery_fee', 5.0); // 5 LYD base fee
        $this->migrator->add('app.delivery_distance_threshold_km', 5.0); // First 5km included
        $this->migrator->add('app.extra_fee_per_km', 1.0); // 1 LYD per extra km
        $this->migrator->add('app.max_delivery_distance_km', 20.0); // Max 20km delivery

        // Payment Settings
        $this->migrator->add('app.credit_card_charge_percentage', 2.5); // 2.5% extra for credit card

        // Store Location (Default: Tripoli center - UPDATE WITH YOUR ACTUAL LOCATION)
        $this->migrator->add('app.store_latitude', 32.8872);
        $this->migrator->add('app.store_longitude', 13.1913);

        // Google Maps API
        $this->migrator->add('app.google_maps_api_key', env('GOOGLE_MAPS_API_KEY'));
    }
};
