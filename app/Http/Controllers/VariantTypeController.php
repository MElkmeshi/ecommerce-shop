<?php

namespace App\Http\Controllers;

use App\Services\VariantTypeService;
use Illuminate\Http\JsonResponse;

class VariantTypeController extends Controller
{
    public function __construct(
        private VariantTypeService $variantTypeService
    ) {}

    /**
     * Get all variant types for public filtering.
     */
    public function index(): JsonResponse
    {
        $variantTypes = $this->variantTypeService->getAllVariantTypes();

        return response()->json($variantTypes);
    }
}
