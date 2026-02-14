<?php

namespace App\Services;

use App\Settings\AppSettings;

class DeliveryFeeCalculator
{
    public function __construct(
        private readonly AppSettings $settings
    ) {}

    /**
     * Calculate delivery fee based on distance
     *
     * @return array{fee: float, distance: float, withinRange: bool, message: string|null}
     */
    public function calculate(float $distanceKm): array
    {
        // Check if within delivery range
        if ($distanceKm > $this->settings->max_delivery_distance_km) {
            return [
                'fee' => 0,
                'distance' => $distanceKm,
                'withinRange' => false,
                'message' => "Sorry, we don't deliver beyond {$this->settings->max_delivery_distance_km} km",
            ];
        }

        // Start with base fee
        $fee = $this->settings->base_delivery_fee;

        // Calculate extra distance if beyond threshold
        if ($distanceKm > $this->settings->delivery_distance_threshold_km) {
            $extraDistance = $distanceKm - $this->settings->delivery_distance_threshold_km;
            $fee += $extraDistance * $this->settings->extra_fee_per_km;
        }

        return [
            'fee' => floor($fee),
            'distance' => round($distanceKm, 2),
            'withinRange' => true,
            'message' => null,
        ];
    }

    /**
     * Calculate payment processing fee for credit card
     */
    public function calculateCreditCardFee(float $subtotal): float
    {
        return round($subtotal * ($this->settings->credit_card_charge_percentage / 100), 2);
    }

    /**
     * Calculate total order amount
     *
     * @return array{subtotal: float, deliveryFee: float, creditCardFee: float, total: float}
     */
    public function calculateTotal(
        float $subtotal,
        float $deliveryFee,
        bool $useCreditCard = false
    ): array {
        $creditCardFee = $useCreditCard ? $this->calculateCreditCardFee($subtotal + $deliveryFee) : 0;

        $total = $subtotal + $deliveryFee + $creditCardFee;

        return [
            'subtotal' => round($subtotal, 2),
            'deliveryFee' => round($deliveryFee, 2),
            'creditCardFee' => round($creditCardFee, 2),
            'total' => round($total, 2),
        ];
    }
}
