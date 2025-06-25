<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Laravel Logo Sticker',
                'description' => 'Official Laravel logo sticker in premium vinyl. Perfect for laptops, water bottles, and more.',
                'price' => 4.99,
                'image_url' => '/images/products/laravel-sticker.png',
                'stock_quantity' => 100,
                'category' => 'Framework',
                'is_active' => true,
            ],
            [
                'name' => 'React Logo Sticker',
                'description' => 'High-quality React logo sticker. Show your love for React with this durable vinyl sticker.',
                'price' => 3.99,
                'image_url' => '/images/products/react-sticker.png',
                'stock_quantity' => 150,
                'category' => 'Framework',
                'is_active' => true,
            ],
            [
                'name' => 'Vue.js Logo Sticker',
                'description' => 'Official Vue.js logo sticker. Waterproof and fade-resistant vinyl material.',
                'price' => 3.99,
                'image_url' => '/images/products/vue-sticker.png',
                'stock_quantity' => 120,
                'category' => 'Framework',
                'is_active' => true,
            ],
            [
                'name' => 'PHP Elephant Sticker',
                'description' => 'Classic PHP elephant logo sticker. A must-have for PHP developers.',
                'price' => 5.99,
                'image_url' => '/images/products/php-sticker.png',
                'stock_quantity' => 80,
                'category' => 'Language',
                'is_active' => true,
            ],
            [
                'name' => 'GitHub Octocat Sticker',
                'description' => 'Official GitHub Octocat sticker. Perfect for showing your open source spirit.',
                'price' => 4.49,
                'image_url' => '/images/products/github-sticker.png',
                'stock_quantity' => 200,
                'category' => 'Platform',
                'is_active' => true,
            ],
            [
                'name' => 'Sentry Logo Sticker',
                'description' => 'Sentry logo sticker for error monitoring enthusiasts. Keep your code under surveillance.',
                'price' => 4.99,
                'image_url' => '/images/products/sentry-sticker.png',
                'stock_quantity' => 110,
                'category' => 'Monitoring',
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
