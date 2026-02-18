<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categoryName = fake()->words(2, true);

        return [
            'name' => [
                'en' => $categoryName,
                'ar' => $categoryName, // In a real scenario, you'd translate this
            ],
        ];
    }
}
