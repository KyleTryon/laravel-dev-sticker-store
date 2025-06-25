<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use Illuminate\Http\Request;

Route::get('/', [ProductController::class, 'index'])->name('home');

// Product routes
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');

// Cart routes
Route::get('/cart', [OrderController::class, 'cart'])->name('cart');
Route::post('/cart/add', [OrderController::class, 'addToCart'])->name('cart.add');
Route::delete('/cart/remove', [OrderController::class, 'removeFromCart'])->name('cart.remove');
Route::patch('/cart/update', [OrderController::class, 'updateCartQuantity'])->name('cart.update');

// Authenticated user routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Order routes
    Route::post('/checkout', [OrderController::class, 'checkout'])->name('checkout');
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    
    // Admin routes (you might want to add proper admin middleware)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/products', [ProductController::class, 'admin'])->name('products');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
        
        Route::get('/orders', [OrderController::class, 'admin'])->name('orders');
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
