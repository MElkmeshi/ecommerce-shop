<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Jobs\SendOrderWebhookJob;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * Create a new order.
     *
     * @throws InsufficientStockException
     */
    public function createOrder(array $data, array $telegramUser): Order
    {
        return DB::transaction(function () use ($data, $telegramUser) {
            // Find or create user
            $user = User::updateOrCreate(
                ['telegram_id' => $telegramUser['id']],
                [
                    'first_name' => $telegramUser['first_name'] ?? null,
                    'last_name' => $telegramUser['last_name'] ?? null,
                    'username' => $telegramUser['username'] ?? null,
                    'language_code' => $telegramUser['language_code'] ?? 'en',
                ]
            );

            // Validate all products and variants exist and have sufficient stock
            $productIds = array_column($data['items'], 'productId');
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            // Collect variant IDs
            $variantIds = array_column($data['items'], 'productVariantId');
            $variants = ProductVariant::whereIn('id', $variantIds)->get()->keyBy('id');

            foreach ($data['items'] as $item) {
                $product = $products->get($item['productId']);

                if (! $product) {
                    throw new \Exception("Product {$item['productId']} not found");
                }

                // Variant is required
                if (empty($item['productVariantId'])) {
                    throw new \Exception("Product variant ID is required for product {$item['productId']}");
                }

                $variant = $variants->get($item['productVariantId']);

                if (! $variant) {
                    throw new \Exception("Product variant {$item['productVariantId']} not found");
                }

                if (! $variant->isInStock($item['quantity'])) {
                    $variantDisplay = $variant->display_name ?: 'Default';
                    throw new InsufficientStockException(
                        "Insufficient stock for product variant: {$product->getTranslation('name', 'en')} ({$variantDisplay})"
                    );
                }
            }

            // Calculate total amount
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $variant = $variants->get($item['productVariantId']);
                $totalAmount += $variant->price * $item['quantity'];
            }

            // Determine payment status based on payment method
            // Cash orders don't need payment, credit card orders need payment
            $paymentStatus = $data['paymentMethod'] === 'cash' ? 'paid' : 'pending';
            $orderStatus = Order::STATUS_PENDING;

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'phone_number' => $data['phoneNumber'],
                'location' => $data['location'],
                'total_amount' => $totalAmount,
                'status' => $orderStatus,
                'payment_method' => $data['paymentMethod'],
                'payment_status' => $paymentStatus,
            ]);

            // Create order items and decrement stock
            foreach ($data['items'] as $item) {
                $product = $products->get($item['productId']);
                $variant = $variants->get($item['productVariantId']);

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $item['quantity'],
                    'price' => $variant->price, // Snapshot price
                ]);

                // Decrement stock on variant
                $variant->decrementStock($item['quantity']);
            }

            // Dispatch webhook notification job (async, non-blocking)
            SendOrderWebhookJob::dispatch($order);

            return $order->load(['items.product', 'user']);
        });
    }

    /**
     * Get user's order history.
     */
    public function getUserOrders(int $telegramId): Collection
    {
        $user = User::where('telegram_id', $telegramId)->first();

        if (! $user) {
            return collect();
        }

        return Order::where('user_id', $user->id)
            ->with(['items.product.category', 'items.productVariant'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
