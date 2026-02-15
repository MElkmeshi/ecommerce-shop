<?php

namespace App\Http\Controllers;

use App\Http\Requests\GetProductsRequest;
use App\Models\Product;
use App\Services\ProductService;
use App\Services\ProductVariantService;
use App\Services\VariantTypeService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService,
        private VariantTypeService $variantTypeService,
        private ProductVariantService $productVariantService
    ) {}

    /**
     * Display a listing of products.
     */
    public function index(GetProductsRequest $request): Response
    {
        $filters = $request->validated();

        $products = $this->productService->getProducts($filters);
        $variantTypes = $this->variantTypeService->getAllVariantTypes();
        $telegramUser = $request->input('telegram_user');

        return Inertia::render('ProductsPage', [
            'user' => $telegramUser ? [
                'name' => $telegramUser['first_name'] ?? $telegramUser['username'] ?? 'User',
                'username' => $telegramUser['username'] ?? null,
            ] : null,
            'products' => $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'image_url' => $product->image_url,
                    'thumb_url' => $product->thumb_url,
                    'category' => [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'slug' => $product->category->slug,
                    ],
                    'product_variants' => $product->productVariants->map(function ($variant) {
                        return [
                            'id' => $variant->id,
                            'price' => $variant->price,
                            'stock' => $variant->stock,
                            'display_name' => $variant->display_name,
                            'variant_values' => $variant->variantValues->map(function ($value) {
                                return [
                                    'id' => $value->id,
                                    'value' => [
                                        'en' => $value->getTranslation('value', 'en'),
                                        'ar' => $value->getTranslation('value', 'ar'),
                                    ],
                                    'variant_type' => [
                                        'id' => $value->variantType->id,
                                        'name' => [
                                            'en' => $value->variantType->getTranslation('name', 'en'),
                                            'ar' => $value->variantType->getTranslation('name', 'ar'),
                                        ],
                                        'slug' => $value->variantType->slug,
                                    ],
                                ];
                            }),
                        ];
                    }),
                ];
            }),
            'variantTypes' => $variantTypes,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): Response
    {
        $product->load(['category', 'primaryVariant']);

        return Inertia::render('ProductDetailPage', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->primaryVariant?->price ?? 0,
                'stock' => $product->primaryVariant?->stock ?? 0,
                'image_url' => $product->image_url,
                'preview_url' => $product->preview_url,
                'category' => [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ],
            ],
        ]);
    }

    /**
     * Get variants for a product.
     */
    public function getVariants(int $id): JsonResponse
    {
        $product = $this->productVariantService->getProductWithVariants($id);

        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json([
            'variants' => $product->productVariants->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'price' => $variant->price,
                    'stock' => $variant->stock,
                    'display_name' => $variant->display_name,
                    'variant_values' => $variant->variantValues->map(function ($value) {
                        return [
                            'id' => $value->id,
                            'value' => [
                                'en' => $value->getTranslation('value', 'en'),
                                'ar' => $value->getTranslation('value', 'ar'),
                            ],
                            'variant_type' => [
                                'id' => $value->variantType->id,
                                'name' => [
                                    'en' => $value->variantType->getTranslation('name', 'en'),
                                    'ar' => $value->variantType->getTranslation('name', 'ar'),
                                ],
                                'slug' => $value->variantType->slug,
                            ],
                        ];
                    }),
                ];
            }),
        ]);
    }
}
