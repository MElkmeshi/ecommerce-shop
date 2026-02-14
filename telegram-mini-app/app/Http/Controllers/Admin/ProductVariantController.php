<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateVariantsRequest;
use App\Http\Requests\UpdateVariantRequest;
use App\Services\ProductVariantService;
use Illuminate\Http\JsonResponse;

class ProductVariantController extends Controller
{
    public function __construct(
        private ProductVariantService $productVariantService
    ) {}

    public function index(int $productId): JsonResponse
    {
        $variants = $this->productVariantService->getProductVariants($productId);

        return response()->json($variants);
    }

    public function generate(GenerateVariantsRequest $request, int $productId): JsonResponse
    {
        $variants = $this->productVariantService->generateVariants(
            $productId,
            $request->validated()['combinations']
        );

        return response()->json($variants, 201);
    }

    public function update(UpdateVariantRequest $request, int $id): JsonResponse
    {
        $variant = $this->productVariantService->updateVariant($id, $request->validated());

        return response()->json($variant);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->productVariantService->deleteVariant($id);

        return response()->json(['message' => 'Variant deleted successfully']);
    }
}
