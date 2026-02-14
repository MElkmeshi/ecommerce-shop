<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\VariantType;
use App\Models\VariantValue;
use Illuminate\Database\Seeder;

class VozolSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Category
        |--------------------------------------------------------------------------
        */
        $category = Category::create([
            'name' => ['en' => 'Vapes', 'ar' => 'السجائر الإلكترونية'],
            'slug' => 'vapes',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Variant Type (Flavor)
        |--------------------------------------------------------------------------
        */
        $flavorType = VariantType::create([
            'name' => ['en' => 'Flavor', 'ar' => 'النكهة'],
            'slug' => 'flavor',
        ]);

        /*
        |--------------------------------------------------------------------------
        | PRODUCT 1 — VOZOL Gear 10000
        |--------------------------------------------------------------------------
        */
        $gear10000 = Product::create([
            'name' => ['en' => 'VOZOL Gear 10000', 'ar' => 'فوزول جير 10000'],
            'description' => ['en' => 'Disposable vape device', 'ar' => 'جهاز السجائر الإلكترونية القابل للتصرف'],
            'category_id' => $category->id,
        ]);

        // Add product image
        $gear10000->addMediaFromUrl('https://vapedubailess.com/cdn/shop/files/Vozol_Gear_Photo.jpg?v=1737467048')
            ->toMediaCollection('product_images');

        $flavors10000 = [
            'Blue Razz Peach',
            'Red Mojito',
            'Mixed Berries',
        ];

        foreach ($flavors10000 as $flavor) {
            $value = VariantValue::firstOrCreate([
                'variant_type_id' => $flavorType->id,
                'value' => ['en' => $flavor, 'ar' => $flavor],
            ]);

            $variant = ProductVariant::create([
                'product_id' => $gear10000->id,
                'price' => 12.00,
                'stock' => 100,
            ]);

            $variant->variantValues()->attach($value->id);
        }

        /*
        |--------------------------------------------------------------------------
        | PRODUCT 2 — VOZOL Gear Shisha 25000
        |--------------------------------------------------------------------------
        */
        $gear25000 = Product::create([
            'name' => ['en' => 'VOZOL Gear Shisha 25000', 'ar' => 'فوزول جير شيشة 25000'],
            'description' => ['en' => 'High capacity disposable vape', 'ar' => 'سجائر إلكترونية عالية السعة'],
            'category_id' => $category->id,
        ]);

        // Add product image
        $gear25000->addMediaFromUrl('https://image.vapesourcing.uk/imagecache/800/images/202412/vozol-gear-shisha-40k.jpg')
            ->toMediaCollection('product_images');

        $flavors25000 = [
            'Blueberry Ice',
            'Grape Ice',
            'Mango Peach',
            'Berry Ice',
            'Berry Mint',
            'Sweet Passionfruit',
            'Watermelon Ice',
            'Mango Freeze',
            'Lemon Mint',
            'Moscow Evenings',
            'Watermelon Mint',
        ];

        foreach ($flavors25000 as $flavor) {
            $value = VariantValue::firstOrCreate([
                'variant_type_id' => $flavorType->id,
                'value' => ['en' => $flavor, 'ar' => $flavor],
            ]);

            $variant = ProductVariant::create([
                'product_id' => $gear25000->id,
                'price' => 18.00,
                'stock' => 100,
            ]);

            $variant->variantValues()->attach($value->id);
        }
    }
}
