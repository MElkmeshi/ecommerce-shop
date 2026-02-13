<?php

namespace App\Services\Admin;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    /**
     * Get all products.
     */
    public function getAllProducts(): Collection
    {
        return Product::with('category')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Create a new product.
     */
    public function createProduct(array $data): Product
    {
        $product = Product::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'stock' => $data['stock'],
            'category_id' => $data['categoryId'],
        ]);

        // Handle image upload if present
        if (isset($data['image'])) {
            $product->addMedia($data['image'])->toMediaCollection('product_images');
        }

        return $product->load('category');
    }

    /**
     * Update a product.
     */
    public function updateProduct(int $id, array $data): ?Product
    {
        $product = Product::find($id);

        if (! $product) {
            return null;
        }

        // Build update data
        $updateData = [];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }

        if (isset($data['description'])) {
            $updateData['description'] = $data['description'];
        }

        if (isset($data['price'])) {
            $updateData['price'] = $data['price'];
        }

        if (isset($data['stock'])) {
            $updateData['stock'] = $data['stock'];
        }

        if (isset($data['categoryId'])) {
            $updateData['category_id'] = $data['categoryId'];
        }

        $product->update($updateData);

        // Handle image upload if present (replaces existing)
        if (isset($data['image'])) {
            $product->clearMediaCollection('product_images');
            $product->addMedia($data['image'])->toMediaCollection('product_images');
        }

        return $product->load('category');
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
