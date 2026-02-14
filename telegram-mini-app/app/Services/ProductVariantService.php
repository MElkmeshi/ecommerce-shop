<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ProductVariantService
{
    /**
     * Get all variants for a product.
     */
    public function getProductVariants(int $productId): Collection
    {
        return ProductVariant::where('product_id', $productId)
            ->with('variantValues.variantType')
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Generate variants for a product from combinations.
     */
    public function generateVariants(int $productId, array $combinations): Collection
    {
        return DB::transaction(function () use ($productId, $combinations) {
            $product = Product::findOrFail($productId);

            // Mark product as having variants
            $product->update(['has_variants' => true]);

            $variants = [];

            foreach ($combinations as $combination) {
                $variant = ProductVariant::create([
                    'product_id' => $productId,
                    'sku' => $combination['sku'] ?? null,
                    'price' => $combination['price'],
                    'stock' => $combination['stock'] ?? 0,
                    'is_default' => $combination['is_default'] ?? false,
                ]);

                // Attach variant values
                if (! empty($combination['variant_value_ids'])) {
                    $variant->variantValues()->attach($combination['variant_value_ids']);
                }

                // Load relationships
                $variant->load('variantValues.variantType');

                $variants[] = $variant;
            }

            return new Collection($variants);
        });
    }

    /**
     * Update a product variant.
     */
    public function updateVariant(int $variantId, array $data): ProductVariant
    {
        $variant = ProductVariant::findOrFail($variantId);

        $variant->update([
            'sku' => $data['sku'] ?? $variant->sku,
            'price' => $data['price'] ?? $variant->price,
            'stock' => $data['stock'] ?? $variant->stock,
            'is_default' => $data['is_default'] ?? $variant->is_default,
        ]);

        if (isset($data['variant_value_ids'])) {
            $variant->variantValues()->sync($data['variant_value_ids']);
        }

        return $variant->load('variantValues.variantType');
    }

    /**
     * Delete a product variant.
     */
    public function deleteVariant(int $variantId): bool
    {
        return DB::transaction(function () use ($variantId) {
            $variant = ProductVariant::findOrFail($variantId);
            $product = $variant->product;

            $result = $variant->delete();

            // If no variants left, mark product as not having variants
            if ($product->productVariants()->count() === 0) {
                $product->update(['has_variants' => false]);
            }

            return $result;
        });
    }

    /**
     * Find a variant by product ID and variant value IDs.
     */
    public function findVariantByValues(int $productId, array $variantValueIds): ?ProductVariant
    {
        sort($variantValueIds);

        return ProductVariant::where('product_id', $productId)
            ->whereHas('variantValues', function ($query) use ($variantValueIds) {
                $query->whereIn('variant_value_id', $variantValueIds);
            }, '=', count($variantValueIds))
            ->with('variantValues.variantType')
            ->first();
    }

    /**
     * Get a product with variants.
     */
    public function getProductWithVariants(int $productId): ?Product
    {
        return Product::with([
            'productVariants.variantValues.variantType',
            'defaultVariant',
        ])->find($productId);
    }
}
