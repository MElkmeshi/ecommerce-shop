<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => ['en' => 'Electronics', 'ar' => 'إلكترونيات'],
                'slug' => 'electronics',
            ],
            [
                'name' => ['en' => 'Clothing', 'ar' => 'ملابس'],
                'slug' => 'clothing',
            ],
            [
                'name' => ['en' => 'Books', 'ar' => 'كتب'],
                'slug' => 'books',
            ],
            [
                'name' => ['en' => 'Home & Garden', 'ar' => 'المنزل والحديقة'],
                'slug' => 'home-garden',
            ],
            [
                'name' => ['en' => 'Sports', 'ar' => 'رياضة'],
                'slug' => 'sports',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        $this->command->info('✅ Created 5 categories with bilingual names');
    }
}
