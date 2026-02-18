<?php

namespace App\Http\Controllers;

use App\Http\Requests\GetProductsRequest;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductVariantResource;
use App\Models\Brand;
use App\Models\Category;
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
        $categories = Category::query()->get();
        $brands = Brand::query()->orderBy('name->en')->get();
        $telegramUser = $request->input('telegram_user');

        return Inertia::render('ProductsPage', [
            'user' => $telegramUser ? [
                'name' => $telegramUser['first_name'] ?? $telegramUser['username'] ?? 'User',
                'username' => $telegramUser['username'] ?? null,
            ] : null,
            'categories' => CategoryResource::collection($categories)->resolve(),
            'brands' => BrandResource::collection($brands)->resolve(),
            'products' => ProductResource::collection($products)->resolve(),
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
            'product' => (new ProductResource($product))->resolve(),
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
            'variants' => ProductVariantResource::collection($product->productVariants)->resolve(),
        ]);
    }
}
