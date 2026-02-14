<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    /**
     * Display the cart page.
     */
    public function index(): Response
    {
        return Inertia::render('CartPage');
    }

    /**
     * Display the checkout page.
     */
    public function checkout(): Response
    {
        return Inertia::render('CheckoutPage');
    }

    /**
     * Validate stock availability for cart items.
     */
    public function validateStock(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.productVariantId' => 'required|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $items = $request->input('items');
        $variantIds = array_column($items, 'productVariantId');
        $variants = ProductVariant::with('product')
            ->whereIn('id', $variantIds)
            ->get()
            ->keyBy('id');

        $stockStatus = [];

        foreach ($items as $item) {
            $variant = $variants->get($item['productVariantId']);

            if (! $variant) {
                $stockStatus[] = [
                    'productVariantId' => $item['productVariantId'],
                    'inStock' => false,
                    'availableStock' => 0,
                    'message' => 'Product variant not found',
                ];

                continue;
            }

            $isInStock = $variant->isInStock($item['quantity']);
            $availableStock = $variant->stock ?? 0;

            $stockStatus[] = [
                'productVariantId' => $item['productVariantId'],
                'inStock' => $isInStock,
                'availableStock' => $availableStock,
                'message' => $isInStock
                    ? null
                    : "Only {$availableStock} available",
            ];
        }

        return response()->json([
            'success' => true,
            'stockStatus' => $stockStatus,
        ]);
    }
}
