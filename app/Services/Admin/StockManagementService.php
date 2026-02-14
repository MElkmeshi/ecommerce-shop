<?php

namespace App\Services\Admin;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class StockManagementService
{
    /**
     * Get all products with their variants for stock management.
     */
    public function getAllProductsWithVariants(): Collection
    {
        return Product::with([
            'category',
            'productVariants.variantValues.variantType',
        ])->orderBy('created_at', 'desc')->get();
    }

    /**
     * Bulk update variant stocks.
     */
    public function bulkUpdateStock(array $updates): bool
    {
        return DB::transaction(function () use ($updates) {
            foreach ($updates as $update) {
                if (isset($update['variant_id']) && isset($update['stock'])) {
                    ProductVariant::where('id', $update['variant_id'])
                        ->update(['stock' => $update['stock']]);
                }
            }

            return true;
        });
    }

    /**
     * Update a single variant's stock.
     */
    public function updateVariantStock(int $variantId, int $stock): ?ProductVariant
    {
        $variant = ProductVariant::find($variantId);

        if (! $variant) {
            return null;
        }

        $variant->update(['stock' => $stock]);

        return $variant->load('variantValues.variantType');
    }
}
