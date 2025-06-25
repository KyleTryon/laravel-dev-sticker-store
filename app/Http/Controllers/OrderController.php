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
        return Inertia::render('Cart/Index');
    }

    public function addToCart(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        
        // Check stock availability
        if ($product->stock_quantity < $validated['quantity']) {
            return response()->json([
                'error' => 'Insufficient stock available'
            ], 400);
        }

        // For now, we'll store cart items in session
        $cart = session()->get('cart', []);
        
        if (isset($cart[$product->id])) {
            $cart[$product->id]['quantity'] += $validated['quantity'];
        } else {
            $cart[$product->id] = [
                'product' => $product,
                'quantity' => $validated['quantity'],
                'price' => $product->price,
            ];
        }
        
        session()->put('cart', $cart);
        
        return response()->json([
            'success' => 'Product added to cart',
            'cart_count' => count($cart)
        ]);
    }

    public function removeFromCart(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
        ]);

        $cart = session()->get('cart', []);
        
        if (isset($cart[$validated['product_id']])) {
            unset($cart[$validated['product_id']]);
            session()->put('cart', $cart);
        }
        
        return response()->json([
            'success' => 'Item removed from cart',
            'cart_count' => count($cart)
        ]);
    }

    public function updateCartQuantity(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = session()->get('cart', []);
        
        if (isset($cart[$validated['product_id']])) {
            $cart[$validated['product_id']]['quantity'] = $validated['quantity'];
            session()->put('cart', $cart);
        }
        
        return response()->json([
            'success' => 'Cart updated'
        ]);
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
