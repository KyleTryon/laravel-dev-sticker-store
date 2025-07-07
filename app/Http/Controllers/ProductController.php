<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();
        $cart = session()->get('cart', []);
        $cartCount = array_sum(array_column($cart, 'quantity'));
        $flash = [
            'success' => session('success'),
            'error' => session('error'),
        ];
        
        return Inertia::render('Products/Index', [
            'products' => $products,
            'cart' => $cart,
            'cartCount' => $cartCount,
            'flash' => $flash
        ]);
    }

    public function show(Product $product)
    {
        return Inertia::render('Products/Show', [
            'product' => $product
        ]);
    }

    public function admin()
    {
        $products = Product::all();
        
        return Inertia::render('Admin/Products', [
            'products' => $products
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'image_url' => 'nullable|url',
            'stock_quantity' => 'required|integer|min:0',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        Product::create($validated);

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'image_url' => 'nullable|url',
            'stock_quantity' => 'required|integer|min:0',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }
}
