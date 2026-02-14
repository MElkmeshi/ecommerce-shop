<?php

namespace App\Payments\Contracts;

use App\Models\PaymentSession;

interface PaymentMethod
{
    /**
     * Initialize payment and return redirect URL.
     */
    public function init(PaymentSession $session): string;

    /**
     * Process payment (for direct payment methods).
     */
    public function pay(PaymentSession $session): bool;

    /**
     * Get the provider code.
     */
    public function getProviderCode(): string;
}
