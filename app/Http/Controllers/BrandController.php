<?php

namespace App\Http\Controllers;

use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;

class BrandController extends Controller
{
    public function apiIndex(): JsonResponse
    {
        $brands = Brand::orderBy('name->en')->get();

        return response()->json([
            'data' => BrandResource::collection($brands),
        ]);
    }
}
