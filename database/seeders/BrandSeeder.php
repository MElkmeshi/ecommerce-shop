<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            [
                'name' => ['en' => 'Apple', 'ar' => 'أبل'],
            ],
            [
                'name' => ['en' => 'Samsung', 'ar' => 'سامسونج'],
            ],
            [
                'name' => ['en' => 'Nike', 'ar' => 'نايكي'],
            ],
            [
                'name' => ['en' => 'Adidas', 'ar' => 'أديداس'],
            ],
            [
                'name' => ['en' => 'Sony', 'ar' => 'سوني'],
            ],
            [
                'name' => ['en' => 'LG', 'ar' => 'إل جي'],
            ],
            [
                'name' => ['en' => 'Dell', 'ar' => 'ديل'],
            ],
            [
                'name' => ['en' => 'HP', 'ar' => 'اتش بي'],
            ],
            [
                'name' => ['en' => 'Lenovo', 'ar' => 'لينوفو'],
            ],
            [
                'name' => ['en' => 'Asus', 'ar' => 'أسوس'],
            ],
        ];

        foreach ($brands as $brand) {
            Brand::create($brand);
        }

        $this->command->info('✅ Created 10 brands with bilingual names');
    }
}
