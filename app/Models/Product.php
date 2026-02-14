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
        'category_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [];
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
     * Get the primary product variant (oldest/first variant).
     */
    public function primaryVariant(): HasOne
    {
        return $this->hasOne(ProductVariant::class)->oldestOfMany();
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
     * Get the display price from the primary variant.
     */
    public function getDisplayPriceAttribute(): float
    {
        return (float) ($this->primaryVariant?->price ?? 0);
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::created(function (Product $product) {
            if ($product->productVariants()->count() === 0) {
                $product->productVariants()->create([
                    'price' => 0,
                    'stock' => 0,
                ]);
            }
        });
    }
}
