<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            // Electronics
            [
                'name' => ['en' => 'Wireless Headphones', 'ar' => 'سماعات لاسلكية'],
                'description' => [
                    'en' => 'High-quality wireless headphones with noise cancellation',
                    'ar' => 'سماعات لاسلكية عالية الجودة مع إلغاء الضوضاء',
                ],
                'price' => 299.99,
                'stock' => 50,
                'category_slug' => 'electronics',
            ],
            [
                'name' => ['en' => 'Smart Watch', 'ar' => 'ساعة ذكية'],
                'description' => [
                    'en' => 'Feature-rich smartwatch with fitness tracking',
                    'ar' => 'ساعة ذكية غنية بالميزات مع تتبع اللياقة البدنية',
                ],
                'price' => 449.99,
                'stock' => 30,
                'category_slug' => 'electronics',
            ],
            [
                'name' => ['en' => 'USB-C Cable', 'ar' => 'كابل USB-C'],
                'description' => [
                    'en' => 'Durable USB-C charging cable, 2 meters',
                    'ar' => 'كابل شحن USB-C متين، 2 متر',
                ],
                'price' => 19.99,
                'stock' => 200,
                'category_slug' => 'electronics',
            ],

            // Clothing
            [
                'name' => ['en' => 'Cotton T-Shirt', 'ar' => 'تيشرت قطني'],
                'description' => [
                    'en' => 'Comfortable 100% cotton t-shirt, available in multiple colors',
                    'ar' => 'تيشرت قطني 100٪ مريح، متوفر بألوان متعددة',
                ],
                'price' => 29.99,
                'stock' => 100,
                'category_slug' => 'clothing',
            ],
            [
                'name' => ['en' => 'Denim Jeans', 'ar' => 'بنطلون جينز'],
                'description' => [
                    'en' => 'Classic fit denim jeans, durable and stylish',
                    'ar' => 'بنطلون جينز بقصة كلاسيكية، متين وأنيق',
                ],
                'price' => 79.99,
                'stock' => 60,
                'category_slug' => 'clothing',
            ],

            // Books
            [
                'name' => ['en' => 'Programming in Python', 'ar' => 'البرمجة بلغة بايثون'],
                'description' => [
                    'en' => 'Comprehensive guide to Python programming for beginners',
                    'ar' => 'دليل شامل لبرمجة بايثون للمبتدئين',
                ],
                'price' => 49.99,
                'stock' => 40,
                'category_slug' => 'books',
            ],
            [
                'name' => ['en' => 'History of Art', 'ar' => 'تاريخ الفن'],
                'description' => [
                    'en' => 'An illustrated journey through art history',
                    'ar' => 'رحلة مصورة عبر تاريخ الفن',
                ],
                'price' => 59.99,
                'stock' => 25,
                'category_slug' => 'books',
            ],

            // Home & Garden
            [
                'name' => ['en' => 'Garden Tools Set', 'ar' => 'مجموعة أدوات الحديقة'],
                'description' => [
                    'en' => 'Complete set of essential garden tools',
                    'ar' => 'مجموعة كاملة من أدوات الحديقة الأساسية',
                ],
                'price' => 89.99,
                'stock' => 35,
                'category_slug' => 'home-garden',
            ],
            [
                'name' => ['en' => 'LED Desk Lamp', 'ar' => 'مصباح مكتب LED'],
                'description' => [
                    'en' => 'Adjustable LED desk lamp with multiple brightness levels',
                    'ar' => 'مصباح مكتب LED قابل للتعديل مع مستويات سطوع متعددة',
                ],
                'price' => 39.99,
                'stock' => 70,
                'category_slug' => 'home-garden',
            ],

            // Sports
            [
                'name' => ['en' => 'Yoga Mat', 'ar' => 'سجادة يوغا'],
                'description' => [
                    'en' => 'Non-slip yoga mat with carrying strap',
                    'ar' => 'سجادة يوغا غير قابلة للانزلاق مع حزام حمل',
                ],
                'price' => 34.99,
                'stock' => 80,
                'category_slug' => 'sports',
            ],
        ];

        foreach ($products as $productData) {
            $category = Category::where('slug', $productData['category_slug'])->first();

            if ($category) {
                $product = Product::create([
                    'name' => $productData['name'],
                    'description' => $productData['description'],
                    'category_id' => $category->id,
                ]);

                // Update the auto-created variant with price and stock
                $variant = $product->productVariants()->first();
                if ($variant) {
                    $variant->update([
                        'price' => $productData['price'],
                        'stock' => $productData['stock'],
                    ]);
                }

                // Add placeholder image from picsum.photos
                try {
                    // Use random image from picsum.photos with seed based on product name
                    $seed = md5($productData['name']['en']);
                    $imageUrl = "https://picsum.photos/seed/{$seed}/800/600";
                    $product->addMediaFromUrl($imageUrl)
                        ->toMediaCollection('product_images');
                } catch (\Exception $e) {
                    // If placeholder service fails, continue without image
                    $this->command->warn("Could not add image for {$productData['name']['en']}: ".$e->getMessage());
                }
            }
        }

        $this->command->info('✅ Created 10 products with bilingual names, descriptions, and placeholder images');
    }
}
