<?php

namespace App\Services;

use App\Models\VariantType;
use App\Models\VariantValue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class VariantTypeService
{
    /**
     * Get all variant types with their values.
     */
    public function getAllVariantTypes(): Collection
    {
        return VariantType::with('variantValues')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get a variant type by ID.
     */
    public function getVariantTypeById(int $id): ?VariantType
    {
        return VariantType::with('variantValues')->find($id);
    }

    /**
     * Create a new variant type with optional values.
     */
    public function createVariantType(array $data): VariantType
    {
        return DB::transaction(function () use ($data) {
            $variantType = VariantType::create([
                'name' => $data['name'],
            ]);

            if (! empty($data['values'])) {
                foreach ($data['values'] as $valueData) {
                    $variantType->variantValues()->create([
                        'value' => $valueData['value'],
                    ]);
                }
            }

            return $variantType->load('variantValues');
        });
    }

    /**
     * Update a variant type and its values.
     */
    public function updateVariantType(int $id, array $data): VariantType
    {
        return DB::transaction(function () use ($id, $data) {
            $variantType = VariantType::findOrFail($id);

            $variantType->update([
                'name' => $data['name'] ?? $variantType->name,
            ]);

            if (isset($data['values'])) {
                // Delete existing values and create new ones
                $variantType->variantValues()->delete();

                foreach ($data['values'] as $valueData) {
                    $variantType->variantValues()->create([
                        'value' => $valueData['value'],
                    ]);
                }
            }

            return $variantType->load('variantValues');
        });
    }

    /**
     * Delete a variant type and cascade to values.
     */
    public function deleteVariantType(int $id): bool
    {
        $variantType = VariantType::findOrFail($id);

        return $variantType->delete();
    }

    /**
     * Create a variant value for a variant type.
     */
    public function createVariantValue(int $variantTypeId, array $data): VariantValue
    {
        $variantType = VariantType::findOrFail($variantTypeId);

        return $variantType->variantValues()->create([
            'value' => $data['value'],
        ]);
    }

    /**
     * Update a variant value.
     */
    public function updateVariantValue(int $id, array $data): VariantValue
    {
        $variantValue = VariantValue::findOrFail($id);

        $variantValue->update([
            'value' => $data['value'] ?? $variantValue->value,
        ]);

        return $variantValue;
    }

    /**
     * Delete a variant value.
     */
    public function deleteVariantValue(int $id): bool
    {
        $variantValue = VariantValue::findOrFail($id);

        return $variantValue->delete();
    }
}
