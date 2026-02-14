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

            // Collect variant IDs if any
            $variantIds = array_filter(array_column($data['items'], 'productVariantId'));
            $variants = $variantIds ? ProductVariant::whereIn('id', $variantIds)->get()->keyBy('id') : collect();

            foreach ($data['items'] as $item) {
                $product = $products->get($item['productId']);

                if (! $product) {
                    throw new \Exception("Product {$item['productId']} not found");
                }

                // Check stock on variant if specified, otherwise on product
                if (! empty($item['productVariantId'])) {
                    $variant = $variants->get($item['productVariantId']);

                    if (! $variant) {
                        throw new \Exception("Product variant {$item['productVariantId']} not found");
                    }

                    if (! $variant->isInStock($item['quantity'])) {
                        throw new InsufficientStockException(
                            "Insufficient stock for product variant: {$product->getTranslation('name', 'en')} ({$variant->display_name})"
                        );
                    }
                } else {
                    if (! $product->isInStock($item['quantity'])) {
                        throw new InsufficientStockException(
                            "Insufficient stock for product: {$product->getTranslation('name', 'en')}"
                        );
                    }
                }
            }

            // Calculate total amount
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                if (! empty($item['productVariantId'])) {
                    $variant = $variants->get($item['productVariantId']);
                    $totalAmount += $variant->price * $item['quantity'];
                } else {
                    $product = $products->get($item['productId']);
                    $totalAmount += $product->price * $item['quantity'];
                }
            }

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'phone_number' => $data['phoneNumber'],
                'location' => $data['location'],
                'total_amount' => $totalAmount,
                'status' => Order::STATUS_PENDING,
            ]);

            // Create order items and decrement stock
            foreach ($data['items'] as $item) {
                $product = $products->get($item['productId']);

                // Determine price and variant
                if (! empty($item['productVariantId'])) {
                    $variant = $variants->get($item['productVariantId']);
                    $price = $variant->price;
                    $variantId = $variant->id;
                } else {
                    $price = $product->price;
                    $variantId = null;
                }

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_variant_id' => $variantId,
                    'quantity' => $item['quantity'],
                    'price' => $price, // Snapshot price
                ]);

                // Decrement stock on variant or product
                if ($variantId) {
                    $variant->decrementStock($item['quantity']);
                } else {
                    $product->decrementStock($item['quantity']);
                }
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
