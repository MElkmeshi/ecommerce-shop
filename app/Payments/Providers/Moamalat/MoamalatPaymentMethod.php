<?php

namespace App\Payments\Providers\Moamalat;

use App\Models\PaymentSession;
use App\Payments\Contracts\PaymentMethod;

class MoamalatPaymentMethod implements PaymentMethod
{
    public function getProviderCode(): string
    {
        return 'moamalat';
    }

    /**
     * Initialize payment and return redirect URL.
     */
    public function init(PaymentSession $session): string
    {
        // Generate unique reference ID for this payment session
        $referenceId = 'ORDER-'.$session->order_id.'-SESSION-'.$session->id.'-'.time();

        // Store the provider session ID (reference ID)
        $session->update([
            'provider_session_id' => $referenceId,
        ]);

        // Return the Moamalat Lightbox payment page URL
        // The React component will handle loading Moamalat scripts and initializing payment
        return route('payments.moamalat.lightbox', ['session' => $session->id]);
    }

    /**
     * Process payment (not used for Moamalat - payment happens via lightbox + webhook).
     */
    public function pay(PaymentSession $session): bool
    {
        return false;
    }
}
