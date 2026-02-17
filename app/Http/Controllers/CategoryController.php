<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Return all categories as JSON (for filter panel).
     */
    public function apiIndex(): JsonResponse
    {
        $categories = Category::all();

        return response()->json(CategoryResource::collection($categories)->resolve());
    }
}
