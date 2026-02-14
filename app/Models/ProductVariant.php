<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'product_id',
        'price',
        'stock',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['display_name'];

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
        ];
    }

    /**
     * Get the product that owns the variant.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the variant values for this product variant.
     */
    public function variantValues(): BelongsToMany
    {
        return $this->belongsToMany(VariantValue::class, 'product_variant_values');
    }

    /**
     * Get the order items for the product variant.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Check if the product variant is in stock.
     */
    public function isInStock(int $quantity = 1): bool
    {
        return $this->stock >= $quantity;
    }

    /**
     * Decrement the product variant stock.
     */
    public function decrementStock(int $quantity): void
    {
        $this->decrement('stock', $quantity);
    }

    /**
     * Get the display name for the variant (e.g., "Size: L, Color: Red").
     */
    public function getDisplayNameAttribute(): string
    {
        $variantValues = $this->variantValues->load('variantType');

        $displayParts = $variantValues->map(function ($variantValue) {
            $typeName = $variantValue->variantType->name;
            $valueName = $variantValue->value;

            return "{$typeName}: {$valueName}";
        });

        return $displayParts->implode(', ');
    }
}
