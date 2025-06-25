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
                'image_url' => 'https://via.placeholder.com/300x300?text=Laravel+Logo',
                'stock_quantity' => 100,
                'category' => 'Framework',
                'is_active' => true,
            ],
            [
                'name' => 'React Logo Sticker',
                'description' => 'High-quality React logo sticker. Show your love for React with this durable vinyl sticker.',
                'price' => 3.99,
                'image_url' => 'https://via.placeholder.com/300x300?text=React+Logo',
                'stock_quantity' => 150,
                'category' => 'Framework',
                'is_active' => true,
            ],
            [
                'name' => 'Vue.js Logo Sticker',
                'description' => 'Official Vue.js logo sticker. Waterproof and fade-resistant vinyl material.',
                'price' => 3.99,
                'image_url' => 'https://via.placeholder.com/300x300?text=Vue.js+Logo',
                'stock_quantity' => 120,
                'category' => 'Framework',
                'is_active' => true,
            ],
            [
                'name' => 'PHP Elephant Sticker',
                'description' => 'Classic PHP elephant logo sticker. A must-have for PHP developers.',
                'price' => 5.99,
                'image_url' => 'https://via.placeholder.com/300x300?text=PHP+Elephant',
                'stock_quantity' => 80,
                'category' => 'Language',
                'is_active' => true,
            ],
            [
                'name' => 'JavaScript Logo Sticker Pack',
                'description' => 'Set of 5 JavaScript-related stickers including JS logo, ES6, Node.js and more.',
                'price' => 12.99,
                'image_url' => 'https://via.placeholder.com/300x300?text=JS+Pack',
                'stock_quantity' => 60,
                'category' => 'Pack',
                'is_active' => true,
            ],
            [
                'name' => 'GitHub Octocat Sticker',
                'description' => 'Official GitHub Octocat sticker. Perfect for showing your open source spirit.',
                'price' => 4.49,
                'image_url' => 'https://via.placeholder.com/300x300?text=GitHub+Octocat',
                'stock_quantity' => 200,
                'category' => 'Platform',
                'is_active' => true,
            ],
            [
                'name' => 'Docker Whale Sticker',
                'description' => 'Docker whale logo sticker. Containerize your laptop with this cool sticker.',
                'price' => 3.49,
                'image_url' => 'https://via.placeholder.com/300x300?text=Docker+Whale',
                'stock_quantity' => 90,
                'category' => 'DevOps',
                'is_active' => true,
            ],
            [
                'name' => 'TypeScript Logo Sticker',
                'description' => 'TypeScript logo sticker for the type-safe JavaScript lovers.',
                'price' => 4.99,
                'image_url' => 'https://via.placeholder.com/300x300?text=TypeScript',
                'stock_quantity' => 110,
                'category' => 'Language',
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
