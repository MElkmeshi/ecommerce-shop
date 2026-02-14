<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Translatable\HasTranslations;

class Product extends Model implements HasMedia
{
    use HasFactory, HasTranslations, InteractsWithMedia;

    /**
     * The attributes that are translatable.
     *
     * @var array
     */
    public $translatable = ['name', 'description'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'stock',
        'category_id',
        'has_variants',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'has_variants' => 'boolean',
        ];
    }

    /**
     * Register media collections.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('product_images')
            ->singleFile() // Only one image per product
            ->registerMediaConversions(function (?Media $media = null) {
                $this->addMediaConversion('thumb')
                    ->width(300)
                    ->height(300)
                    ->sharpen(10);

                $this->addMediaConversion('preview')
                    ->width(800)
                    ->height(600)
                    ->sharpen(10);
            });
    }

    /**
     * Get the category that owns the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the order items for the product.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the product variants.
     */
    public function productVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get the default product variant.
     */
    public function defaultVariant(): HasOne
    {
        return $this->hasOne(ProductVariant::class)->where('is_default', true);
    }

    /**
     * Decrement the product stock.
     */
    public function decrementStock(int $quantity): void
    {
        $this->decrement('stock', $quantity);
    }

    /**
     * Check if the product is in stock.
     */
    public function isInStock(int $quantity = 1): bool
    {
        return $this->stock >= $quantity;
    }

    /**
     * Get the product's image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('product_images');
    }

    /**
     * Get the product's thumbnail URL.
     */
    public function getThumbUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('product_images', 'thumb');
    }

    /**
     * Get the product's preview URL.
     */
    public function getPreviewUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('product_images', 'preview');
    }

    /**
     * Get the effective price (from default variant if has variants, otherwise base price).
     */
    public function getEffectivePriceAttribute(): float
    {
        if ($this->has_variants && $this->relationLoaded('defaultVariant') && $this->defaultVariant) {
            return (float) $this->defaultVariant->price;
        }

        return (float) $this->price;
    }

    /**
     * Get the effective stock (from default variant if has variants, otherwise base stock).
     */
    public function getEffectiveStockAttribute(): int
    {
        if ($this->has_variants && $this->relationLoaded('defaultVariant') && $this->defaultVariant) {
            return $this->defaultVariant->stock;
        }

        return $this->stock;
    }
}
