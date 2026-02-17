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
            ],
            [
                'name' => ['en' => 'Clothing', 'ar' => 'ملابس'],
            ],
            [
                'name' => ['en' => 'Books', 'ar' => 'كتب'],
            ],
            [
                'name' => ['en' => 'Home & Garden', 'ar' => 'المنزل والحديقة'],
            ],
            [
                'name' => ['en' => 'Sports', 'ar' => 'رياضة'],
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        $this->command->info('✅ Created 5 categories with bilingual names');
    }
}
