<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $categories = ['Framework', 'Library', 'Language', 'Tool', 'Database'];
        
        return [
            'name' => $this->faker->word() . ' Sticker',
            'description' => $this->faker->sentence(),
            'price' => $this->faker->randomFloat(2, 2.99, 19.99),
            'image_url' => '/images/products/' . $this->faker->slug() . '.png',
            'stock_quantity' => $this->faker->numberBetween(10, 200),
            'category' => $this->faker->randomElement($categories),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the product is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
