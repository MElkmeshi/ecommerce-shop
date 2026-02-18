<?php

namespace App\Services\Admin;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ProductService
{
    /**
     * Get all products.
     */
    public function getAllProducts(): Collection
    {
        return Product::with(['category', 'primaryVariant', 'productVariants'])->orderBy('created_at', 'desc')->get();
    }

    /**
     * Create a new product.
     */
    public function createProduct(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category_id' => $data['categoryId'],
                'brand_id' => $data['brandId'] ?? null,
            ]);

            // Create initial variant with provided price/stock
            $product->productVariants()->create([
                'price' => $data['price'] ?? 0,
                'stock' => $data['stock'] ?? 0,
            ]);

            // Handle image upload if present
            if (isset($data['image'])) {
                $product->addMedia($data['image'])->toMediaCollection('product_images');
            }

            return $product->load(['category', 'primaryVariant']);
        });
    }

    /**
     * Update a product.
     */
    public function updateProduct(int $id, array $data): ?Product
    {
        $product = Product::with('primaryVariant')->find($id);

        if (! $product) {
            return null;
        }

        return DB::transaction(function () use ($product, $data) {
            // Build product update data
            $productUpdateData = [];

            if (isset($data['name'])) {
                $productUpdateData['name'] = $data['name'];
            }

            if (isset($data['description'])) {
                $productUpdateData['description'] = $data['description'];
            }

            if (isset($data['categoryId'])) {
                $productUpdateData['category_id'] = $data['categoryId'];
            }

            if (isset($data['brandId'])) {
                $productUpdateData['brand_id'] = $data['brandId'];
            }

            if (! empty($productUpdateData)) {
                $product->update($productUpdateData);
            }

            // Update primary variant if price or stock provided
            if (isset($data['price']) || isset($data['stock'])) {
                $variantUpdateData = [];

                if (isset($data['price'])) {
                    $variantUpdateData['price'] = $data['price'];
                }

                if (isset($data['stock'])) {
                    $variantUpdateData['stock'] = $data['stock'];
                }

                if ($product->primaryVariant && ! empty($variantUpdateData)) {
                    $product->primaryVariant->update($variantUpdateData);
                }
            }

            // Handle image upload if present (replaces existing)
            if (isset($data['image'])) {
                $product->clearMediaCollection('product_images');
                $product->addMedia($data['image'])->toMediaCollection('product_images');
            }

            return $product->load(['category', 'primaryVariant']);
        });
    }

    /**
     * Delete a product.
     */
    public function deleteProduct(int $id): bool
    {
        $product = Product::find($id);

        if (! $product) {
            return false;
        }

        // Delete associated media
        $product->clearMediaCollection('product_images');

        return $product->delete();
    }
}
