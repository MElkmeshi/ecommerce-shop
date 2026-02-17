<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VariantValueResource extends JsonResource
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
            'value' => [
                'en' => $this->getTranslation('value', 'en'),
                'ar' => $this->getTranslation('value', 'ar'),
            ],
            'variant_type' => $this->whenLoaded('variantType', fn () => (new VariantTypeResource($this->variantType))->resolve()),
        ];
    }
}
