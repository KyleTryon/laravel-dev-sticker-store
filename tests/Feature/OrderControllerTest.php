<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test products
        Product::factory()->create([
            'id' => 1,
            'name' => 'Laravel Sticker',
            'description' => 'Cool Laravel sticker',
            'price' => 5.99,
            'stock_quantity' => 100,
            'category' => 'Framework',
            'image_url' => '/images/products/laravel.png',
        ]);

        Product::factory()->create([
            'id' => 2,
            'name' => 'React Sticker',
            'description' => 'Cool React sticker',
            'price' => 4.99,
            'stock_quantity' => 50,
            'category' => 'Library',
            'image_url' => '/images/products/react.png',
        ]);
    }


    /** @test */
    public function it_displays_empty_cart()
    {
        $response = $this->get(route('cart'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('cartItems', [])
            ->where('cartCount', 0)
        );
    }

    /** @test */
    public function it_adds_product_to_cart()
    {
        $product = Product::find(1);

        $response = $this->post(route('cart.add'), [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertRedirect(route('home'));
        
        $cart = session('cart');
        $this->assertNotNull($cart);
        $this->assertArrayHasKey($product->id, $cart);
        $this->assertEquals(2, $cart[$product->id]['quantity']);
        $this->assertEquals($product->name, $cart[$product->id]['product']['name']);
    }

    /** @test */
    public function it_increments_quantity_when_adding_existing_product()
    {
        $product = Product::find(1);

        // Add product first time
        $this->post(route('cart.add'), [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        // Add same product again
        $this->post(route('cart.add'), [
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $cart = session('cart');
        $this->assertEquals(5, $cart[$product->id]['quantity']);
    }

    /** @test */
    public function it_validates_product_exists_when_adding_to_cart()
    {
        $response = $this->post(route('cart.add'), [
            'product_id' => 999, // Non-existent product
            'quantity' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
    }

    /** @test */
    public function it_validates_minimum_quantity_when_adding_to_cart()
    {
        $response = $this->post(route('cart.add'), [
            'product_id' => 1,
            'quantity' => 0,
        ]);

        $response->assertSessionHasErrors('quantity');
    }

    /** @test */
    public function it_removes_product_from_cart()
    {
        // Add product to cart first
        $this->post(route('cart.add'), [
            'product_id' => 1,
            'quantity' => 2,
        ]);

        // Remove the product
        $response = $this->delete(route('cart.remove'), [
            'product_id' => 1,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Item removed from cart');
        
        $cart = session('cart');
        $this->assertArrayNotHasKey(1, $cart);
    }

    /** @test */
    public function it_updates_cart_quantity()
    {
        // Add product to cart first
        $this->post(route('cart.add'), [
            'product_id' => 1,
            'quantity' => 2,
        ]);

        // Update quantity
        $response = $this->patch(route('cart.update'), [
            'product_id' => 1,
            'quantity' => 5,
        ]);

        $response->assertRedirect();
        
        $cart = session('cart');
        $this->assertEquals(5, $cart[1]['quantity']);
    }

    /** @test */
    public function it_validates_minimum_quantity_when_updating()
    {
        $response = $this->patch(route('cart.update'), [
            'product_id' => 1,
            'quantity' => 0,
        ]);

        $response->assertSessionHasErrors('quantity');
    }

    /** @test */
    public function it_accepts_canadian_postal_code_without_space()
    {
        $response = $this->postJson(route('cart.estimate-shipping'), [
            'zip_code' => 'K1A0A6',
            'country' => 'Canada',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
    }


    /** @test */
    public function it_includes_cart_context_in_shipping_logs()
    {
        Log::spy();

        // Add items to cart
        $this->post(route('cart.add'), [
            'product_id' => 1,
            'quantity' => 2,
        ]);

        // Estimate shipping
        $this->postJson(route('cart.estimate-shipping'), [
            'zip_code' => '12345',
            'country' => 'United States',
        ]);

        Log::shouldHaveReceived('info')
            ->atLeast()->once()
            ->with('Shipping estimation successful', \Mockery::on(function ($context) {
                return isset($context['cart_context'])
                    && isset($context['cart_context']['items_count'])
                    && $context['cart_context']['items_count'] === 1;
            }));
    }
}
