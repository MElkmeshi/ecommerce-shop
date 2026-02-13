<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendOrderWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 1;

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
        $webhookUrl = config('services.webhook.url');

        if (! $webhookUrl) {
            Log::info('No webhook URL configured, skipping order notification');

            return;
        }

        try {
            // Load relationships
            $this->order->load(['user', 'items.product']);

            // Prepare payload
            $payload = [
                'order_id' => $this->order->id,
                'user' => [
                    'telegram_id' => $this->order->user->telegram_id,
                    'first_name' => $this->order->user->first_name,
                    'last_name' => $this->order->user->last_name,
                    'username' => $this->order->user->username,
                ],
                'phone_number' => $this->order->phone_number,
                'location' => $this->order->location,
                'total_amount' => $this->order->total_amount,
                'status' => $this->order->status,
                'items' => $this->order->items->map(function ($item) {
                    return [
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'subtotal' => $item->subtotal,
                    ];
                })->toArray(),
                'timestamp' => $this->order->created_at->toIso8601String(),
            ];

            // Send webhook request
            $response = Http::timeout(10)->post($webhookUrl, $payload);

            if ($response->successful()) {
                Log::info("Order webhook sent successfully for order #{$this->order->id}");
            } else {
                Log::warning("Order webhook failed for order #{$this->order->id}: {$response->status()}");
            }
        } catch (\Exception $e) {
            // Log error but don't retry (matches Node.js behavior)
            Log::error("Order webhook error for order #{$this->order->id}: {$e->getMessage()}");
        }
    }
}
