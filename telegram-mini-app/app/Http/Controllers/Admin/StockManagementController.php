<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\StockManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockManagementController extends Controller
{
    public function __construct(
        private StockManagementService $stockManagementService
    ) {}

    /**
     * Display the stock management page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/StockManagementPage');
    }

    /**
     * API: Get all products with variants for stock management.
     */
    public function apiIndex(): JsonResponse
    {
        $products = $this->stockManagementService->getAllProductsWithVariants();

        return response()->json([
            'success' => true,
            'products' => $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => [
                        'en' => $product->getTranslation('name', 'en'),
                        'ar' => $product->getTranslation('name', 'ar'),
                    ],
                    'category' => [
                        'id' => $product->category->id,
                        'name' => [
                            'en' => $product->category->getTranslation('name', 'en'),
                            'ar' => $product->category->getTranslation('name', 'ar'),
                        ],
                    ],
                    'image_url' => $product->image_url,
                    'thumb_url' => $product->thumb_url,
                    'variants' => $product->productVariants->map(function ($variant) {
                        return [
                            'id' => $variant->id,
                            'price' => $variant->price,
                            'stock' => $variant->stock,
                            'display_name' => $variant->display_name ?: 'Default',
                            'variant_values' => $variant->variantValues->map(function ($value) {
                                return [
                                    'id' => $value->id,
                                    'value' => $value->value,
                                    'type' => [
                                        'id' => $value->variantType->id,
                                        'name' => $value->variantType->name,
                                    ],
                                ];
                            }),
                        ];
                    }),
                ];
            }),
        ]);
    }

    /**
     * Bulk update variant stocks.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.variant_id' => 'required|integer|exists:product_variants,id',
            'updates.*.stock' => 'required|integer|min:0',
        ]);

        $this->stockManagementService->bulkUpdateStock($validated['updates']);

        return response()->json([
            'success' => true,
            'message' => 'Stock updated successfully',
        ]);
    }

    /**
     * Update a single variant's stock.
     */
    public function updateVariantStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $variant = $this->stockManagementService->updateVariantStock($id, $validated['stock']);

        if (! $variant) {
            return response()->json([
                'success' => false,
                'error' => 'Variant not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'variant' => [
                'id' => $variant->id,
                'stock' => $variant->stock,
            ],
        ]);
    }
}
