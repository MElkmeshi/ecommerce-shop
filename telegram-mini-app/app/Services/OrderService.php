<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Jobs\SendOrderWebhookJob;
use App\Models\Order;
use App\Models\Product;
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

            // Validate all products exist and have sufficient stock
            $productIds = array_column($data['items'], 'productId');
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($data['items'] as $item) {
                $product = $products->get($item['productId']);

                if (! $product) {
                    throw new \Exception("Product {$item['productId']} not found");
                }

                if (! $product->isInStock($item['quantity'])) {
                    throw new InsufficientStockException(
                        "Insufficient stock for product: {$product->getTranslation('name', 'en')}"
                    );
                }
            }

            // Calculate total amount
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $product = $products->get($item['productId']);
                $totalAmount += $product->price * $item['quantity'];
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

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price, // Snapshot price
                ]);

                // Decrement stock
                $product->decrementStock($item['quantity']);
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
            ->with(['items.product.category'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
