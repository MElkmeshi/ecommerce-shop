<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class CancelUnpaidOrder implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Order $order
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Refresh the order to get the latest state
        $this->order->refresh();

        // Only cancel if the order is still pending payment
        if ($this->order->payment_status !== 'pending') {
            return;
        }

        // Only cancel if payment method is credit_card
        if ($this->order->payment_method !== 'credit_card') {
            return;
        }

        // Only cancel if order status is still pending
        if ($this->order->status !== Order::STATUS_PENDING) {
            return;
        }

        DB::transaction(function () {
            // Restore stock for all order items
            foreach ($this->order->items as $item) {
                if ($item->productVariant) {
                    $item->productVariant->increment('stock', $item->quantity);
                }
            }

            // Cancel the order
            $this->order->update([
                'status' => Order::STATUS_CANCELLED,
                'payment_status' => 'cancelled',
            ]);
        });
    }
}
