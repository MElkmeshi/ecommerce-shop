<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/CategoriesPage');
    }

    public function apiIndex(): JsonResponse
    {
        $categories = Category::orderBy('created_at', 'desc')->get();

        return response()->json(CategoryResource::collection($categories));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name.en' => 'required|string|max:255',
            'name.ar' => 'required|string|max:255',
        ]);

        $category = Category::create([
            'name' => $validated['name'],
        ]);

        return response()->json([
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name.en' => 'required|string|max:255',
            'name.ar' => 'required|string|max:255',
        ]);

        $category->update($validated);

        return response()->json([
            'data' => new CategoryResource($category),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        // Check if category has products
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing products',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
