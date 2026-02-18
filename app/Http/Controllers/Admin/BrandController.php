<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/BrandsPage');
    }

    public function apiIndex(): JsonResponse
    {
        $brands = Brand::orderBy('created_at', 'desc')->get();

        return response()->json(BrandResource::collection($brands));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name.en' => 'required|string|max:255',
            'name.ar' => 'required|string|max:255',
        ]);

        $brand = Brand::create([
            'name' => $validated['name'],
        ]);

        return response()->json([
            'data' => new BrandResource($brand),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name.en' => 'required|string|max:255',
            'name.ar' => 'required|string|max:255',
        ]);

        $brand->update($validated);

        return response()->json([
            'data' => new BrandResource($brand),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        // Check if brand has products
        if ($brand->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete brand with existing products',
            ], 422);
        }

        $brand->delete();

        return response()->json(['message' => 'Brand deleted successfully']);
    }
}
