<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Brand>
 */
class BrandFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $brandName = fake()->company();

        return [
            'name' => [
                'en' => $brandName,
                'ar' => $brandName, // In a real scenario, you'd translate this
            ],
        ];
    }
}
