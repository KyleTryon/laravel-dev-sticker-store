import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
    category: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    price: number;
}

interface Props {
    cartItems: { [key: number]: CartItem };
    errors?: { [key: string]: string };
}

export default function CartIndex({ cartItems, errors }: Props) {
    const { patch, delete: destroy, processing } = useForm();
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponProcessing, setCouponProcessing] = useState(false);

    // Ensure cartItems is always an object
    const safeCartItems = cartItems || {};

    // Handle server-side errors
    useEffect(() => {
        if (errors?.error) {
            setCouponError(errors.error);
        }
    }, [errors]);

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }

        patch(route('cart.update'), {
            product_id: productId,
            quantity: quantity,
        });
    };

    const removeItem = (productId: number) => {
        destroy(route('cart.remove', { product_id: productId }));
    };

    const handleApplyCoupon = (couponCode: string) => {
        setCouponError(null); // Clear any previous errors
        setCouponProcessing(true);
        
        // Wrap the entire coupon application process in a Sentry span
        Sentry.startSpan(
            {
                name: `Apply Coupon: ${couponCode}`,
                op: 'ui.action',
                attributes: {
                    'coupon.code': couponCode,
                    'component': 'CartIndex',
                    'action': 'applyCoupon',
                    'cart.items.count': getTotalItems(),
                    'cart.total.price': getTotalPrice().toFixed(2),
                    'user.agent': navigator.userAgent,
                    'timestamp': new Date().toISOString()
                }
            },
            async () => {
                // Add breadcrumb for Sentry tracking
                Sentry.addBreadcrumb({
                    category: 'user.action',
                    message: 'User attempted to apply coupon code',
                    level: 'info',
                    data: {
                        couponCode: couponCode,
                        component: 'CartIndex'
                    }
                });
                
                try {
                    // Use fetch directly to handle the JSON response
                    const response = await fetch(route('cart.apply-coupon'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            coupon_code: couponCode
                        })
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        
                        // Capture the error in Sentry frontend
                        Sentry.captureException(new Error(data.error || 'Unable to process coupon code'), {
                            tags: {
                                location: 'frontend',
                                component: 'CartIndex',
                                action: 'applyCoupon',
                                errorType: 'coupon_processing'
                            },
                            extra: {
                                couponCode: couponCode,
                                responseStatus: response.status,
                                responseData: data,
                                userAgent: navigator.userAgent,
                                timestamp: new Date().toISOString()
                            },
                            level: 'error'
                        });
                        
                        throw new Error(data.error || 'Unable to process coupon code');
                    }
                    
                    const data = await response.json();
                    // This shouldn't happen since we always return an error
                    setCouponError('Unexpected success response');
                    
                } catch (error) {
                    setCouponError(error instanceof Error ? error.message : 'Unknown error occurred');
                } finally {
                    setCouponProcessing(false);
                }
            }
        );
    };

    const getTotalPrice = () => {
        return Object.values(safeCartItems).reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    };

    const getTotalItems = () => {
        return Object.values(safeCartItems).reduce((total, item) => {
            return total + item.quantity;
        }, 0);
    };

    const cartItemsArray = Object.values(safeCartItems);

    return (
        <>
            <Head title="Shopping Cart" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <header className="bg-white shadow-sm dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                                    Dev Sticker Store
                                </Link>
                            </div>
                            <nav className="flex items-center space-x-4">
                                <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                    Products
                                </Link>
                                <span className="text-gray-600 dark:text-gray-300">Cart ({getTotalItems()})</span>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Shopping Cart
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Review your items before checkout
                        </p>
                    </div>

                    {cartItemsArray.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Your cart is empty
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Add some awesome stickers to get started!
                            </p>
                            <Link href="/">
                                <Button>
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2">
                                <div className="space-y-4">
                                    {cartItemsArray.map((item) => (
                                        <Card key={item.product.id}>
                                            <CardContent className="p-6">
                                                <div className="flex items-center space-x-4">
                                                    <img 
                                                        src={item.product.image_url} 
                                                        alt={item.product.name}
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {item.product.name}
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                                            {item.product.category}
                                                        </p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            ${item.price}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                            disabled={processing}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            disabled={processing}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeItem(item.product.id)}
                                                            disabled={processing}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span>Subtotal ({getTotalItems()} items)</span>
                                                <span>${getTotalPrice().toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Shipping</span>
                                                <span>Free</span>
                                            </div>
                                            
                                            {/* Coupon Code Section */}
                                            <div className="border-t pt-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Coupon Code
                                                    </label>
                                                    <div className="flex space-x-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Enter coupon code"
                                                            className="flex-1"
                                                            id="coupon-code"
                                                            onChange={() => setCouponError(null)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={couponProcessing}
                                                            onClick={() => {
                                                                const couponCode = (document.getElementById('coupon-code') as HTMLInputElement)?.value;
                                                                if (couponCode) {
                                                                    handleApplyCoupon(couponCode);
                                                                }
                                                            }}
                                                        >
                                                            Apply
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Test Sentry error tracking by entering any coupon code
                                                    </p>
                                                    
                                                    {/* Error Alert */}
                                                    {couponError && (
                                                        <Alert variant="destructive">
                                                            <AlertCircleIcon />
                                                            <AlertTitle>Coupon Error</AlertTitle>
                                                            <AlertDescription>
                                                                {couponError}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="border-t pt-4">
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total</span>
                                                    <span>${getTotalPrice().toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <Button 
                                                className="w-full" 
                                                size="lg"
                                                disabled={processing}
                                            >
                                                Proceed to Checkout
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}