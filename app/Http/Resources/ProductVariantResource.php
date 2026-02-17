<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'price' => $this->price,
            'stock' => $this->stock,
            'display_name' => $this->display_name,
            'variant_values' => $this->whenLoaded('variantValues', fn () => VariantValueResource::collection($this->variantValues)->resolve()),
        ];
    }
}
