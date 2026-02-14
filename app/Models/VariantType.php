<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Translatable\HasTranslations;

class VariantType extends Model
{
    use HasFactory, HasTranslations;

    /**
     * The attributes that are translatable.
     *
     * @var array
     */
    public $translatable = ['name'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * Get the variant values for the variant type.
     */
    public function variantValues(): HasMany
    {
        return $this->hasMany(VariantValue::class);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($variantType) {
            if (! $variantType->slug) {
                // Generate slug from English name
                $englishName = $variantType->getTranslation('name', 'en');
                $variantType->slug = Str::slug($englishName);
            }
        });
    }
}
