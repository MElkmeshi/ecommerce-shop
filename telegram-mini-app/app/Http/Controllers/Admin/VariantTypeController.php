<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateVariantTypeRequest;
use App\Http\Requests\UpdateVariantTypeRequest;
use App\Services\VariantTypeService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class VariantTypeController extends Controller
{
    public function __construct(
        private VariantTypeService $variantTypeService
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/VariantTypesPage');
    }

    public function apiIndex(): JsonResponse
    {
        $variantTypes = $this->variantTypeService->getAllVariantTypes();

        return response()->json($variantTypes);
    }

    public function store(CreateVariantTypeRequest $request): JsonResponse
    {
        $variantType = $this->variantTypeService->createVariantType($request->validated());

        return response()->json($variantType, 201);
    }

    public function update(UpdateVariantTypeRequest $request, int $id): JsonResponse
    {
        $variantType = $this->variantTypeService->updateVariantType($id, $request->validated());

        return response()->json($variantType);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->variantTypeService->deleteVariantType($id);

        return response()->json(['message' => 'Variant type deleted successfully']);
    }
}
