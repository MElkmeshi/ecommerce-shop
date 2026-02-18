<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
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
            'name' => [
                'en' => $this->getTranslation('name', 'en'),
                'ar' => $this->getTranslation('name', 'ar'),
            ],
            'description' => [
                'en' => $this->getTranslation('description', 'en', false) ?? '',
                'ar' => $this->getTranslation('description', 'ar', false) ?? '',
            ],
            'image_url' => $this->image_url,
            'thumb_url' => $this->thumb_url,
            'preview_url' => $this->when($this->preview_url, $this->preview_url),
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'brand_id' => $this->brand_id,
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'price' => $this->whenLoaded('primaryVariant', fn () => $this->primaryVariant?->price ?? 0),
            'stock' => $this->whenLoaded('primaryVariant', fn () => $this->primaryVariant?->stock ?? 0),
            'variant_count' => $this->whenLoaded('productVariants', fn () => $this->productVariants->count()),
            'product_variants' => $this->whenLoaded('productVariants', fn () => ProductVariantResource::collection($this->productVariants)->resolve()),
        ];
    }
}
