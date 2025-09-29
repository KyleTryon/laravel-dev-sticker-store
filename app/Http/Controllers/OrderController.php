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
        $cartCount = array_sum(array_column($cart, 'quantity'));
        // Handle old cart structure and convert to new structure
        if (is_array($cart) && array_key_exists('cart_count', $cart) && array_key_exists('cart_items', $cart)) {
            Log::info('Cart structure migrated from old format', [
                'old_cart_count' => $cart['cart_count'] ?? 0,
                'old_cart_items' => count($cart['cart_items'] ?? []),
                            'user_id' => 'guest',
            'user_type' => 'guest',
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
                return $item['product']['price'] * $item['quantity'];
            }, $cart)),
            'user_id' => 'guest',
            'user_type' => 'guest',
        ]);
        
        return Inertia::render('Cart/Index', [
            'cartItems' => $cart,
            'cartCount' => $cartCount,
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
            ];
        }
        session()->put('cart', $cart);
        
        // Log cart addition metrics
        Log::info('Product added to cart (homepage)', [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_price' => $product->price,
            'product_category' => $product->category,
            'quantity_added' => $validated['quantity'],
            'user_id' => 'guest',
            'user_id' => 'guest',
        ]);

        return redirect()->route('home');
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
            Log::info('Product removed from cart (homepage)', [
                'product_id' => $validated['product_id'],
                'quantity_removed' => $removedItem['quantity'],
                'user_id' => 'guest',
            ]);
        }

        // Log if cart is now empty
        if (empty($cart)) {
            Log::info('Cart emptied', [
                'user_id' => 'guest',
            ]);
        }

        return back()->with('success', 'Item removed from cart');
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

        return redirect()->back();
    }

    public function applyCoupon(Request $request)
    {
        // Log the incoming request, now with cart info and coupon code value if present
        $cart = session()->get('cart', []);
        $couponCodeValue = $request->input('coupon_code', null);
        $couponCodeForLog = $couponCodeValue !== null && $couponCodeValue !== '' ? $couponCodeValue : 'null';
        Log::info('Coupon application request received', [
            'coupon_code_custom' => $couponCodeForLog,
            'test_field_abc123' => 'should_appear_in_sentry',
            'debug_info' => 'debug',
            'user_id' => 'guest',
            'cart' => $cart,
        ]);

        $couponCode = $request->input('coupon_code');
        $userId = 'guest';

        // Check if coupon code is empty
        if (empty(trim($couponCode))) {
            Log::warning('Empty coupon code received', [
                'received_value' => $couponCode,
                'received_length' => strlen($couponCode),
                'user_id' => $userId,
                'user_type' => 'guest',
                'cart_context' => [
                    'items_count' => count($cart),
                    'total_items' => array_sum(array_column($cart, 'quantity')),
                    'total_value' => array_sum(array_map(function($item) {
                        return $item['product']['price'] * $item['quantity'];
                    }, $cart)),
                ],
                'session_id' => session()->getId(),
            ]);
            
            return response()->json([
                'error' => 'Please enter a valid coupon code',
                'message' => 'Coupon code cannot be empty'
            ], 400);
        }

        // Validate the coupon code format (only for non-empty codes)
        $validated = $request->validate([
            'coupon_code' => 'required|string|max:50',
        ]);

        Log::info('Processing coupon code', [
            'coupon_code' => $validated['coupon_code'],
            'coupon_code_length' => strlen($validated['coupon_code']),
            'user_id' => $userId,
            'cart_count' => count($cart),
            'test_field_abc123' => 'should_appear_in_sentry'
        ]);

        $couponCode = $validated['coupon_code'];


        Log::error('Coupon validation failed', [
            'coupon_code' => $couponCode,
            'user_id' => $userId,
            'user_type' => 'guest',
            'cart_context' => [
                'items_count' => count($cart),
                'total_items' => array_sum(array_column($cart, 'quantity')),
                'total_value' => array_sum(array_map(function($item) {
                    return $item['product']['price'] * $item['quantity'];
                }, $cart)),
            ],
            'session_id' => session()->getId(),
        ]);

        return response()->json([
            'error' => 'Invalid coupon code',
            'message' => 'The coupon code "' . $couponCode . '" is not valid'
        ], 400);
    }

    public function estimateShipping(Request $request)
    {
        // Log the incoming request with cart info and both zip code and country values if present
        $cart = session()->get('cart', []);
        $zipCodeValue = $request->input('zip_code', null);
        $countryValue = $request->input('country', null);
        $zipCodeForLog = $zipCodeValue !== null && $zipCodeValue !== '' ? $zipCodeValue : 'null';
        $countryForLog = $countryValue !== null && $countryValue !== '' ? $countryValue : 'null';
        Log::info('Shipping estimation request received', [
            'zip_code_custom' => $zipCodeForLog,
            'country_custom' => $countryForLog,
            'test_field_shipping123' => 'should_appear_in_sentry',
            'debug_info' => 'shipping_debug',
            'user_id' => 'guest',
            'cart' => $cart,
        ]);

        $zipCode = $request->input('zip_code');
        $country = $request->input('country', '');
        $userId = 'guest';

        // Check if zip code is empty
        if (empty(trim($zipCode))) {
            Log::warning('Empty zip code received', [
                'received_value' => $zipCode,
                'received_length' => strlen($zipCode),
                'country' => $country,
                'user_id' => $userId,
                'user_type' => 'guest',
                'cart_context' => [
                    'items_count' => count($cart),
                    'total_items' => array_sum(array_column($cart, 'quantity')),
                    'total_value' => array_sum(array_map(function($item) {
                        return $item['product']['price'] * $item['quantity'];
                    }, $cart)),
                ],
                'session_id' => session()->getId(),
            ]);
            
            return response()->json([
                'error' => 'Please enter a valid ZIP code',
                'message' => 'ZIP code cannot be empty'
            ], 400);
        }

        // Validate the zip code and country format
        $validated = $request->validate([
            'zip_code' => 'required|string|max:10',
            'country' => 'nullable|string|max:50',
        ]);

        Log::info('Processing zip code and country for shipping estimation', [
            'zip_code' => $validated['zip_code'],
            'zip_code_length' => strlen($validated['zip_code']),
            'country' => $validated['country'] ?? 'none',
            'user_id' => $userId,
            'cart_count' => count($cart),
            'test_field_shipping123' => 'should_appear_in_sentry'
        ]);

        $zipCode = $validated['zip_code'];
        $country = $validated['country'] ?? '';


        if (empty($country)) {
            Log::error('Shipping estimation failed - missing country', [
                'zip_code' => $zipCode,
                'country' => $country,
                'user_id' => $userId,
                'user_type' => 'guest',
                'cart_context' => [
                    'items_count' => count($cart),
                    'total_items' => array_sum(array_column($cart, 'quantity')),
                    'total_value' => array_sum(array_map(function($item) {
                        return $item['product']['price'] * $item['quantity'];
                    }, $cart)),
                ],
                'session_id' => session()->getId(),
                'shipping_service' => 'test_shipping_api',
                'error_type' => 'missing_country'
            ]);
            
            return response()->json([
                'error' => 'Please select a country to estimate shipping costs',
                'message' => 'Country selection is required for shipping estimation'
            ], 400);
        }

        // Check if country is supported (US or Canada)
        $supportedCountries = ['United States', 'Canada'];
        if (!in_array($country, $supportedCountries)) {
            Log::error('Shipping estimation failed - unsupported country', [
                'zip_code' => $zipCode,
                'country' => $country,
                'user_id' => $userId,
                'user_type' => 'guest',
                'supported_countries' => $supportedCountries,
                'cart_context' => [
                    'items_count' => count($cart),
                    'total_items' => array_sum(array_column($cart, 'quantity')),
                    'total_value' => array_sum(array_map(function($item) {
                        return $item['product']['price'] * $item['quantity'];
                    }, $cart)),
                ],
                'session_id' => session()->getId(),
                'shipping_service' => 'test_shipping_api',
                'error_type' => 'international_shipping_not_supported'
            ]);
            
            return response()->json([
                'error' => 'International shipping to ' . $country . ' is not currently supported',
                'message' => 'We currently only ship to the United States and Canada'
            ], 400);
        }

        // Validate postal code format based on country
        if ($country === 'United States') {
            // US ZIP code validation
            if (preg_match('/[X]/', $zipCode)) {
                Log::error('Shipping estimation failed - corrupted US ZIP code', [
                    'zip_code' => $zipCode,
                    'country' => $country,
                    'user_id' => $userId,
                    'user_type' => 'guest',
                    'error_type' => 'invalid_us_zip_format'
                ]);
                
                return response()->json([
                    'error' => 'Invalid US ZIP code format detected. Please enter only numbers',
                    'message' => 'ZIP code contains invalid characters'
                ], 400);
            }

            if (strlen($zipCode) < 5) {
                Log::warning('Shipping estimation failed - invalid US ZIP code length', [
                    'zip_code' => $zipCode,
                    'zip_length' => strlen($zipCode),
                    'country' => $country,
                    'user_id' => $userId,
                ]);
                
                return response()->json([
                    'error' => 'Please enter a valid 5-digit US ZIP code',
                    'message' => 'ZIP code must be at least 5 digits'
                ], 400);
            }
        } elseif ($country === 'Canada') {
            // Canadian postal code validation (format: A1A 1A1 or A1A1A1)
            $cleanedPostalCode = strtoupper(str_replace(' ', '', $zipCode));
            if (!preg_match('/^[A-Z]\d[A-Z]\d[A-Z]\d$/', $cleanedPostalCode)) {
                Log::warning('Shipping estimation failed - invalid Canadian postal code', [
                    'postal_code' => $zipCode,
                    'cleaned_postal_code' => $cleanedPostalCode,
                    'country' => $country,
                    'user_id' => $userId,
                    'error_type' => 'invalid_canadian_postal_code'
                ]);
                
                return response()->json([
                    'error' => 'Please enter a valid Canadian postal code (e.g., K1A 0A6)',
                    'message' => 'Canadian postal code must be in format A1A 1A1'
                ], 400);
            }
        }


        Log::info('Shipping estimation successful', [
            'zip_code' => $zipCode,
            'country' => $country,
            'user_id' => $userId,
            'user_type' => 'guest',
            'cart_context' => [
                'items_count' => count($cart),
                'total_items' => array_sum(array_column($cart, 'quantity')),
                'total_value' => array_sum(array_map(function($item) {
                    return $item['product']['price'] * $item['quantity'];
                }, $cart)),
            ],
            'session_id' => session()->getId(),
            'shipping_service' => 'test_shipping_api',
        ]);

        // Set fixed $8.99 shipping for US and Canada as requested
        $standardShipping = 8.99;
        $expeditedShipping = 16.99;  // Premium option remains higher
        
        // Log the country-specific shipping calculation
        Log::info('Shipping costs calculated for US/Canada', [
            'country' => $country,
            'zip_code' => $zipCode,
            'standard_shipping' => $standardShipping,
            'expedited_shipping' => $expeditedShipping,
            'user_id' => $userId
        ]);

        return response()->json([
            'success' => true,
            'shipping_options' => [
                [
                    'name' => 'Standard Shipping',
                    'cost' => $standardShipping,
                    'estimated_days' => '5-7 business days'
                ],
                [
                    'name' => 'Expedited Shipping', 
                    'cost' => $expeditedShipping,
                    'estimated_days' => '2-3 business days'
                ]
            ],
            'message' => 'Shipping estimates calculated for ZIP code ' . $zipCode
        ], 200);
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
            $totalAmount += $item['product']['price'] * $item['quantity'];
        }

        // Log order processing interaction
        Log::info('Processing order', [
            'user_id' => 'guest',
            'cart_count' => count($cart),
            'total_amount' => $totalAmount,
            'shipping_country' => $validated['shipping_address']['country'],
            'payment_method' => $validated['payment_method'],
        ]);

        // Create order
        $order = Order::create([
            'user_id' => 'guest',
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
                'price' => $item['product']['price'],
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
            'user_id' => 'guest',
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

    public function clearCart(Request $request)
    {
        $cart = session()->get('cart', []);
        $cartItemCount = count($cart);
        $totalItems = array_sum(array_column($cart, 'quantity'));
        $totalValue = array_sum(array_map(function($item) {
            return $item['product']['price'] * $item['quantity'];
        }, $cart));

        // Clear the cart session
        session()->forget('cart');

        // Log cart clearing for tracking
        Log::info('Cart cleared after order completion', [
            'previous_cart_items' => $cartItemCount,
            'previous_total_items' => $totalItems,
            'previous_total_value' => $totalValue,
            'user_id' => 'guest',
            'user_type' => 'guest',
            'timestamp' => now()->toISOString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully',
            'previous_cart_info' => [
                'items' => $cartItemCount,
                'total_quantity' => $totalItems,
                'total_value' => $totalValue
            ]
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
