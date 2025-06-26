<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function cart()
    {
        $cart = session()->get('cart', []);
        
        // Handle old cart structure and convert to new structure
        if (is_array($cart) && array_key_exists('cart_count', $cart) && array_key_exists('cart_items', $cart)) {
            Log::info('Cart structure migrated from old format', [
                'old_cart_count' => $cart['cart_count'] ?? 0,
                'old_cart_items' => count($cart['cart_items'] ?? []),
            ]);
            // This is the old structure, convert to new empty structure
            $cart = [];
            session()->put('cart', $cart);
        }
        
        // Log cart metrics for analysis
        Log::info('Cart page accessed', [
            'cart_item_count' => count($cart),
            'cart_total_items' => array_sum(array_column($cart, 'quantity')),
            'cart_total_value' => array_sum(array_map(function($item) {
                return $item['price'] * $item['quantity'];
            }, $cart)),
            'user_id' => auth()->id(),
        ]);
        
        return Inertia::render('Cart/Index', [
            'cartItems' => $cart
        ]);
    }

    public function addToCart(Request $request)
    {
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
        
        // Log cart addition metrics
        Log::info('Product added to cart', [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity_added' => $validated['quantity'],
            'product_price' => $product->price,
            'cart_total_items' => array_sum(array_column($cart, 'quantity')),
            'cart_total_value' => array_sum(array_map(function($item) {
                return $item['price'] * $item['quantity'];
            }, $cart)),
            'user_id' => auth()->id(),
        ]);

        return redirect()->route('home')->with('success', 'Product added to cart successfully!');
    }

    public function removeFromCart(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
        ]);

        $cart = session()->get('cart', []);
        $removedItem = null;
        
        if (isset($cart[$validated['product_id']])) {
            $removedItem = $cart[$validated['product_id']];
            unset($cart[$validated['product_id']]);
        }
        session()->put('cart', $cart);
        
        // Log cart removal metrics
        if ($removedItem) {
            Log::info('Product removed from cart', [
                'product_id' => $validated['product_id'],
                'product_name' => $removedItem['product']['name'] ?? 'Unknown',
                'quantity_removed' => $removedItem['quantity'],
                'product_price' => $removedItem['price'],
                'cart_total_items' => array_sum(array_column($cart, 'quantity')),
                'cart_total_value' => array_sum(array_map(function($item) {
                    return $item['price'] * $item['quantity'];
                }, $cart)),
                'user_id' => auth()->id(),
            ]);
        }

        return back()->with('success', 'Item removed from cart');
    }

    public function updateCartQuantity(Request $request)
    {
        // For this structure, you may want to ignore or remove this method, or adapt it if you want to track quantities
        return back()->with('success', 'Cart updated');
    }

    public function applyCoupon(Request $request)
    {
        $validated = $request->validate([
            'coupon_code' => 'required|string|max:50',
        ]);

        // Add breadcrumb for Sentry tracking
        Sentry::addBreadcrumb([
            'category' => 'coupon.processing',
            'message' => 'Processing coupon code',
            'level' => 'info',
            'data' => [
                'couponCode' => $validated['coupon_code'],
                'component' => 'OrderController'
            ]
        ]);

        // This method is designed to throw an exception for Sentry testing
        // Any coupon code will trigger an exception
        throw new \Exception('Unable to process coupon code: ' . $validated['coupon_code'] . '. This is a test error for Sentry distributed tracing.');
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

        // Log checkout completion metrics
        Log::info('Order completed successfully', [
            'order_id' => $order->id,
            'user_id' => Auth::id(),
            'total_amount' => $totalAmount,
            'payment_method' => $validated['payment_method'],
            'shipping_country' => $validated['shipping_address']['country'],
            'items_count' => count($cart),
            'total_items' => array_sum(array_column($cart, 'quantity')),
        ]);

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
