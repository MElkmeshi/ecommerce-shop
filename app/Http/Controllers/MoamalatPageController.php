<?php

namespace App\Http\Controllers;

use App\Models\PaymentSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MoamalatPay\Transaction;

class MoamalatPageController extends Controller
{
    /**
     * Display the Moamalat Lightbox payment form.
     */
    public function show(PaymentSession $session): Response
    {
        if (! $session->isPending()) {
            abort(400, 'Payment session is not pending');
        }

        // Convert amount to millimes
        $amountInMillimes = (int) ($session->amount_with_commission * 1000);

        return Inertia::render('MoamalatCheckoutPage', [
            'session' => [
                'id' => $session->id,
                'order_id' => $session->order_id,
                'amount' => $session->amount,
                'amount_with_commission' => $session->amount_with_commission,
                'provider_session_id' => $session->provider_session_id,
            ],
            'amount' => $amountInMillimes,
            'referenceId' => $session->provider_session_id,
            'mid' => config('moamalat-pay.merchant_id'),
            'tid' => config('moamalat-pay.terminal_id'),
            'isProduction' => config('moamalat-pay.production', false),
        ]);
    }

    /**
     * Handle payment callback from client-side JavaScript.
     */
    public function handle(Request $request, PaymentSession $session): JsonResponse
    {
        if (! $session->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Payment already processed',
            ]);
        }

        $providerTransactionId = $request->input('provider_transaction_id');

        if (! $providerTransactionId) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction ID is required',
            ], 400);
        }

        // Verify transaction with Moamalat API
        try {
            $transaction = new Transaction($providerTransactionId, $session->provider_session_id);
            $success = $transaction->getWithDefault('ResCodeDesc', 'Failed') === 'Approved';

            if ($success) {
                $session->markAsPayed($providerTransactionId);

                // Update order status and payment status
                if ($session->order) {
                    $session->order->update([
                        'status' => 'processing',
                        'payment_status' => 'paid',
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment successful',
                    'order_id' => $session->order_id,
                ]);
            }

            $session->markAsFailed();

            return response()->json([
                'success' => false,
                'message' => 'Payment failed',
            ]);
        } catch (\Exception $e) {
            $session->markAsFailed();

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed: '.$e->getMessage(),
            ], 500);
        }
    }
}
