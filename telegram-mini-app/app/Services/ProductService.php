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
        $query = Product::with('category');

        // Search by name (check both English and Arabic)
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name->en', 'LIKE', "%{$search}%")
                    ->orWhere('name->ar', 'LIKE', "%{$search}%");
            });
        }

        // Filter by category slug
        if (! empty($filters['category'])) {
            $query->whereHas('category', function ($q) use ($filters) {
                $q->where('slug', $filters['category']);
            });
        }

        // Filter by price range
        if (isset($filters['minPrice'])) {
            $query->where('price', '>=', $filters['minPrice']);
        }

        if (isset($filters['maxPrice'])) {
            $query->where('price', '<=', $filters['maxPrice']);
        }

        // Sorting
        $sort = $filters['sort'] ?? 'newest';
        switch ($sort) {
            case 'name':
                $query->orderByRaw('JSON_UNQUOTE(JSON_EXTRACT(name, "$.en")) ASC');
                break;
            case 'price-asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price-desc':
                $query->orderBy('price', 'desc');
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
}
