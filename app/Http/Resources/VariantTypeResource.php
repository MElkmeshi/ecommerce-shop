<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VariantTypeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name, // Returns translation for current locale
            'variant_values' => $this->when($this->relationLoaded('variantValues'), function () {
                return VariantValueResource::collection($this->variantValues)->resolve();
            }, []),
        ];
    }
}
