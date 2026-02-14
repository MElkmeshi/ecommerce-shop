<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentManager $paymentManager
    ) {}

    /**
     * Initialize a payment for an order.
     */
    public function init(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'provider' => 'required|string|in:moamalat',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        // Create payment session
        $session = $this->paymentManager->createSession(
            providerCode: $validated['provider'],
            orderId: $order->id,
            amount: $order->total_amount
        );

        // Get payment redirect URL
        $redirectUrl = $this->paymentManager->init($session);

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'redirect_url' => $redirectUrl,
            'amount' => $session->amount,
            'amount_with_commission' => $session->amount_with_commission,
        ]);
    }

    /**
     * Get payment session status.
     */
    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:payment_sessions,id',
        ]);

        $session = \App\Models\PaymentSession::findOrFail($validated['session_id']);

        return response()->json([
            'success' => true,
            'status' => $session->status,
            'order_id' => $session->order_id,
            'amount' => $session->amount,
            'provider_transaction_id' => $session->provider_transaction_id,
        ]);
    }

    /**
     * Get available payment providers.
     */
    public function providers(): JsonResponse
    {
        $providers = $this->paymentManager->getAvailableProviders();

        return response()->json([
            'success' => true,
            'providers' => $providers,
        ]);
    }
}
