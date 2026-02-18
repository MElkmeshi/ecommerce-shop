<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    /**
     * Get products with filters and sorting.
     */
    public function getProducts(array $filters): Collection
    {
        $query = Product::with(['category', 'productVariants.variantValues.variantType']);

        // Search by name (check both English and Arabic)
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name->en', 'LIKE', "%{$search}%")
                    ->orWhere('name->ar', 'LIKE', "%{$search}%");
            });
        }

        // Filter by category ID
        if (! empty($filters['category'])) {
            $query->where('category_id', $filters['category']);
        }

        // Filter by brand ID
        if (! empty($filters['brand'])) {
            $query->where('brand_id', $filters['brand']);
        }

        // Filter by variant values
        if (! empty($filters['variantValues']) && is_array($filters['variantValues'])) {
            $query->whereHas('productVariants.variantValues', function ($q) use ($filters) {
                $q->whereIn('variant_value_id', $filters['variantValues']);
            });
        }

        // Filter by price range (check variant prices)
        if (isset($filters['minPrice'])) {
            $query->whereHas('productVariants', function ($q) use ($filters) {
                $q->where('price', '>=', $filters['minPrice']);
            });
        }

        if (isset($filters['maxPrice'])) {
            $query->whereHas('productVariants', function ($q) use ($filters) {
                $q->where('price', '<=', $filters['maxPrice']);
            });
        }

        // Hide products with 0 stock (all products have variants now)
        $query->whereHas('productVariants', function ($q) {
            $q->where('stock', '>', 0);
        });

        // Sorting
        $sort = $filters['sort'] ?? 'newest';
        switch ($sort) {
            case 'name':
                $query->orderByRaw('JSON_UNQUOTE(JSON_EXTRACT(name, "$.en")) ASC');
                break;
            case 'price-asc':
                // Sort by primary variant price (lowest ID variant)
                $query->orderBy(
                    \App\Models\ProductVariant::select('price')
                        ->whereColumn('product_id', 'products.id')
                        ->orderBy('id')
                        ->limit(1),
                    'asc'
                );
                break;
            case 'price-desc':
                // Sort by primary variant price (lowest ID variant)
                $query->orderBy(
                    \App\Models\ProductVariant::select('price')
                        ->whereColumn('product_id', 'products.id')
                        ->orderBy('id')
                        ->limit(1),
                    'desc'
                );
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        return $query->get();
    }

    /**
     * Get a product by ID.
     */
    public function getProductById(int $id): ?Product
    {
        return Product::with('category')->find($id);
    }

    /**
     * Get a product with variants by ID.
     */
    public function getProductWithVariants(int $id): ?Product
    {
        return Product::with([
            'category',
            'productVariants.variantValues.variantType',
            'primaryVariant',
        ])->find($id);
    }
}
