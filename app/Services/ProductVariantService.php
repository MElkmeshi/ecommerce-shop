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
            ->orderBy('id', 'asc')
            ->get();
    }

    /**
     * Generate variants for a product from combinations.
     */
    public function generateVariants(int $productId, array $combinations): Collection
    {
        return DB::transaction(function () use ($productId, $combinations) {
            $product = Product::findOrFail($productId);

            // Delete existing "empty" default variant (one without variant values)
            ProductVariant::where('product_id', $productId)
                ->whereDoesntHave('variantValues')
                ->delete();

            $variants = [];

            foreach ($combinations as $combination) {
                $variant = ProductVariant::create([
                    'product_id' => $productId,
                    'price' => $combination['price'],
                    'stock' => $combination['stock'] ?? 0,
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
            'price' => $data['price'] ?? $variant->price,
            'stock' => $data['stock'] ?? $variant->stock,
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

            // Prevent deletion if this is the only variant
            if ($product->productVariants()->count() === 1) {
                throw new \Exception('Cannot delete the last variant. Every product must have at least one variant.');
            }

            return $variant->delete();
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
            'primaryVariant',
        ])->find($productId);
    }
}
