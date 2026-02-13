<?php

namespace App\Services\Admin;

use App\Models\Category;

class CategoryService
{
    /**
     * Create a new category.
     */
    public function createCategory(array $data): Category
    {
        return Category::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
        ]);
    }

    /**
     * Update a category.
     */
    public function updateCategory(int $id, array $data): ?Category
    {
        $category = Category::find($id);

        if (! $category) {
            return null;
        }

        $updateData = [];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }

        if (isset($data['slug'])) {
            $updateData['slug'] = $data['slug'];
        }

        $category->update($updateData);

        return $category;
    }

    /**
     * Delete a category.
     *
     * @throws \Exception if category has products
     */
    public function deleteCategory(int $id): bool
    {
        $category = Category::find($id);

        if (! $category) {
            return false;
        }

        // Validate no products exist for this category
        if ($category->products()->count() > 0) {
            throw new \Exception('Cannot delete category with existing products');
        }

        return $category->delete();
    }
}
