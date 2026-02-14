<?php

namespace App\Payments;

use App\Models\PaymentSession;
use App\Payments\Contracts\PaymentMethod;
use App\Payments\Providers\Moamalat\MoamalatPaymentMethod;
use InvalidArgumentException;

class PaymentManager
{
    /**
     * Available payment providers.
     */
    protected array $providers = [];

    public function __construct()
    {
        $this->registerProviders();
    }

    /**
     * Register all payment providers.
     */
    protected function registerProviders(): void
    {
        $this->providers['moamalat'] = new MoamalatPaymentMethod;
    }

    /**
     * Get a payment provider by code.
     */
    public function provider(string $code): PaymentMethod
    {
        if (! isset($this->providers[$code])) {
            throw new InvalidArgumentException("Payment provider [{$code}] not found.");
        }

        return $this->providers[$code];
    }

    /**
     * Create a new payment session.
     */
    public function createSession(
        string $providerCode,
        ?int $orderId = null,
        ?float $amount = null
    ): PaymentSession {
        $provider = $this->provider($providerCode);

        return PaymentSession::create([
            'order_id' => $orderId,
            'provider_code' => $providerCode,
            'amount' => $amount,
            'status' => 'pending',
        ]);
    }

    /**
     * Initialize payment and get redirect URL.
     */
    public function init(PaymentSession $session): string
    {
        $provider = $this->provider($session->provider_code);

        return $provider->init($session);
    }

    /**
     * Process payment.
     */
    public function pay(PaymentSession $session): bool
    {
        $provider = $this->provider($session->provider_code);

        return $provider->pay($session);
    }

    /**
     * Get all available providers.
     */
    public function getAvailableProviders(): array
    {
        return array_keys($this->providers);
    }
}
