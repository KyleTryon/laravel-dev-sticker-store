<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function cart()
    {
        $cart = session()->get('cart', []);
        \Log::info('=== CART PAGE DEBUG START ===');
        \Log::info('Cart from session: ' . json_encode($cart));
        \Log::info('Cart type: ' . gettype($cart));
        \Log::info('Cart count: ' . count($cart));
        
        // Handle old cart structure and convert to new structure
        if (is_array($cart) && array_key_exists('cart_count', $cart) && array_key_exists('cart_items', $cart)) {
            \Log::info('Converting old cart structure to new structure');
            // This is the old structure, convert to new empty structure
            $cart = [];
            session()->put('cart', $cart);
        }
        
        \Log::info('Final cart structure: ' . json_encode($cart));
        \Log::info('=== CART PAGE DEBUG END ===');
        
        return Inertia::render('Cart/Index', [
            'cartItems' => $cart
        ]);
    }

    public function addToCart(Request $request)
    {
        \Log::info('=== ADD TO CART DEBUG START ===');
        \Log::info('Request received: ' . json_encode([
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'all_data' => $request->all(),
            'session_id' => $request->session()->getId(),
        ]));

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $cart = session()->get('cart', []);
        // Add or update product in cart
        if (isset($cart[$product->id])) {
            $cart[$product->id]['quantity'] += $validated['quantity'];
        } else {
            $cart[$product->id] = [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'stock_quantity' => $product->stock_quantity,
                    'category' => $product->category,
                ],
                'quantity' => $validated['quantity'],
                'price' => $product->price,
            ];
        }
        session()->put('cart', $cart);
        \Log::info('Cart after update: ' . json_encode($cart));
        \Log::info('Session cart saved');
        \Log::info('Session saved to storage');
        \Log::info('Verification - cart from session: ' . json_encode(session()->get('cart')));
        \Log::info('=== ADD TO CART DEBUG END ===');

        return redirect()->route('home')->with('success', 'Product added to cart successfully!');
    }

    public function removeFromCart(Request $request)
    {
        \Log::info('=== REMOVE FROM CART DEBUG START ===');
        \Log::info('Request received: ' . json_encode([
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'all_data' => $request->all(),
            'session_id' => $request->session()->getId(),
        ]));

        $validated = $request->validate([
            'product_id' => 'required|integer',
        ]);

        $cart = session()->get('cart', []);
        if (isset($cart[$validated['product_id']])) {
            unset($cart[$validated['product_id']]);
        }
        session()->put('cart', $cart);
        \Log::info('Cart after removal: ' . json_encode($cart));
        \Log::info('Session cart saved');
        \Log::info('Session saved to storage');
        \Log::info('Verification - cart from session: ' . json_encode(session()->get('cart')));
        \Log::info('=== REMOVE FROM CART DEBUG END ===');

        return back()->with('success', 'Item removed from cart');
    }

    public function updateCartQuantity(Request $request)
    {
        // For this structure, you may want to ignore or remove this method, or adapt it if you want to track quantities
        return back()->with('success', 'Cart updated');
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.state' => 'required|string',
            'shipping_address.zip' => 'required|string',
            'shipping_address.country' => 'required|string',
            'payment_method' => 'required|string',
        ]);

        $cart = session()->get('cart', []);
        
        if (empty($cart)) {
            return response()->json([
                'error' => 'Cart is empty'
            ], 400);
        }

        $totalAmount = 0;
        foreach ($cart as $item) {
            $totalAmount += $item['price'] * $item['quantity'];
        }

        // Create order
        $order = Order::create([
            'user_id' => Auth::id(),
            'total_amount' => $totalAmount,
            'status' => 'pending',
            'shipping_address' => $validated['shipping_address'],
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
        ]);

        // Create order items
        foreach ($cart as $productId => $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $productId,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ]);

            // Update product stock
            $product = Product::find($productId);
            $product->decrement('stock_quantity', $item['quantity']);
        }

        // Clear cart
        session()->forget('cart');

        return response()->json([
            'success' => 'Order placed successfully',
            'order_id' => $order->id
        ]);
    }

    public function show(Order $order)
    {
        $order->load(['orderItems.product', 'user']);
        
        return Inertia::render('Orders/Show', [
            'order' => $order
        ]);
    }

    public function index()
    {
        $orders = Auth::user()->orders()->with('orderItems.product')->latest()->get();
        
        return Inertia::render('Orders/Index', [
            'orders' => $orders
        ]);
    }

    public function admin()
    {
        $orders = Order::with(['user', 'orderItems.product'])->latest()->get();
        
        return Inertia::render('Admin/Orders', [
            'orders' => $orders
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Order status updated successfully.');
    }
}
