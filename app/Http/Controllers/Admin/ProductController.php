<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\Admin\ProductResource;
use App\Models\Product;
use App\Services\Admin\ProductService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {}

    /**
     * Display a listing of products.
     */
    public function index(): Response
    {
        return Inertia::render('admin/AdminProductsPage');
    }

    /**
     * API: Get all products.
     */
    public function apiIndex(): JsonResponse
    {
        $products = $this->productService->getAllProducts();

        return response()->json([
            'success' => true,
            'products' => ProductResource::collection($products),
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(CreateProductRequest $request): JsonResponse
    {
        $product = $this->productService->createProduct($request->validated());
        $product->load(['category', 'primaryVariant']);

        return response()->json([
            'success' => true,
            'product' => new ProductResource($product),
        ], 201);
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = $this->productService->updateProduct($id, $request->validated());

        if (! $product) {
            return response()->json([
                'success' => false,
                'error' => 'Product not found',
            ], 404);
        }

        $product->load(['category', 'primaryVariant']);

        return response()->json([
            'success' => true,
            'product' => new ProductResource($product),
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->productService->deleteProduct($id);

        if (! $deleted) {
            return response()->json([
                'success' => false,
                'error' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
