import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}

interface CartUpdateData {
    product_id: number;
    quantity: number;
}

interface Props {
    cartItems: { [key: number]: CartItem };
    cartCount: number;
    errors?: { [key: string]: string };
}

export default function CartIndex({ cartItems, cartCount, errors }: Props) {
    const { delete: destroy, processing } = useForm();
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponProcessing, setCouponProcessing] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);
    const [shippingProcessing, setShippingProcessing] = useState(false);
    const [shippingSuccess, setShippingSuccess] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

    // Ensure cartItems is always an object
    const safeCartItems = cartItems || {};

    // Generate or retrieve guest user ID
    const getGuestUserId = (): string => {
        // For demo purposes, use a simple static guest ID
        return 'guest';
    };

    // Handle server-side errors
    useEffect(() => {
        if (errors?.error) {
            setCouponError(errors.error);
        }
        if (errors?.shipping_error) {
            setShippingError(errors.shipping_error);
        }
    }, [errors]);

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        router.patch(route('cart.update'), {
            product_id: productId,
            quantity: quantity,
        }, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                if (page && page.props) {
                    const updatedCart = page.props.cart || {};
                    setQuantities(
                        Object.fromEntries(
                            Object.entries(updatedCart).map(([id, item]: [string, any]) => [id, item.quantity])
                        )
                    );
                } else {
                    setQuantities(prev => ({ ...prev, [productId]: quantity }));
                }
            }
        });
    };

    const removeItem = (productId: number) => {
        destroy(route('cart.remove', { product_id: productId }));
    };

    const handleApplyCoupon = (couponCode: string) => {
        console.info(`🛒 handleApplyCoupon called with coupon code: ${couponCode}`, { couponCode });
        setCouponError(null); // Clear any previous errors
        setCouponProcessing(true);
        
        const guestUserId = getGuestUserId();
        console.debug(`👤 Guest user ID: ${guestUserId}`, { guestUserId });
        
        // Log cart information for context
        console.debug(`🛍️ Cart information: ${getTotalItems()} items, $${getTotalPrice().toFixed(2)} total`, {
            cartItems: JSON.stringify(safeCartItems),
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
            itemCount: Object.keys(safeCartItems).length
        });
        
        const actualCouponCode = couponCode;
        
        console.warn(`🛒 Applying Coupon Code: ${actualCouponCode}`, {
            userEnteredCode: actualCouponCode,
            originalParameter: couponCode,
            guestUserId: guestUserId,
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
            itemCount: Object.keys(safeCartItems).length
        });
        
        fetch(route('cart.apply-coupon'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                coupon_code: actualCouponCode,
            })
        })
        .then(async (response) => {
            console.debug(`📡 Response received: ${response.status} ${response.statusText}`, { 
                status: response.status, 
                statusText: response.statusText 
            });
            
            if (!response.ok) {
                const data = await response.json();
                console.error(`❌ Error response data: ${data.error || 'Unknown error'}`, {
                    error: data.error || 'Unknown error',
                    message: data.message || '',
                    status: response.status,
                    statusText: response.statusText
                });
                
                Sentry.captureException(new Error(data.error || 'Invalid coupon code'), {
                    tags: {
                        location: 'frontend',
                        component: 'CartIndex',
                        action: 'applyCoupon',
                        errorType: 'coupon_validation',
                        userType: 'guest'
                    },
                    extra: {
                        userEnteredCouponCode: actualCouponCode,
                        originalParameter: couponCode,
                        guestUserId: guestUserId,
                        totalItems: getTotalItems(),
                        totalPrice: getTotalPrice(),
                        itemCount: Object.keys(safeCartItems).length,
                        responseStatus: response.status,
                        responseData: JSON.stringify(data),
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    },
                    level: 'error'
                });
                
                
                throw new Error(data.error || 'Invalid coupon code');
            }
            
            const data = await response.json();
            console.warn(`✅ Unexpected success response: ${JSON.stringify(data)}`, {
                responseData: JSON.stringify(data)
            });
            setCouponError('Unexpected success response');
        })
        .catch((error) => {
            console.error(`💥 Caught error: ${error.message}`, { 
                errorMessage: error.message,
                errorName: error.name,
                errorStack: error.stack
            });
            setCouponError(error instanceof Error ? error.message : 'Invalid coupon code');
        })
        .finally(() => {
            console.debug(`🏁 Coupon processing finished for user: ${guestUserId}`, { guestUserId });
            setCouponProcessing(false);
        });
    };

    const handleEstimateShipping = (zipCode: string, country: string) => {
        console.info(`📦 handleEstimateShipping called with zip code: ${zipCode}, country: ${country}`, { zipCode, country });
        setShippingError(null); // Clear any previous errors
        setShippingSuccess(null); // Clear any previous success messages
        setShippingProcessing(true);
        
        const guestUserId = getGuestUserId();
        console.debug(`👤 Guest user ID for shipping: ${guestUserId}`, { guestUserId });
        
        // Log cart information for context
        console.debug(`🛍️ Shipping estimation for cart: ${getTotalItems()} items, $${getTotalPrice().toFixed(2)} total`, {
            cartItems: JSON.stringify(safeCartItems),
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
            itemCount: Object.keys(safeCartItems).length
        });
        
        const actualCountry = country;
        
        let processedZipCode = zipCode;
        if (country !== 'United States' && country !== '') {
            processedZipCode = zipCode
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '')
                .substring(0, 5);
            
            if (processedZipCode.length < 3) {
                processedZipCode = '';
            }
        }
        
        console.warn(`📦 Estimating Shipping for Zip Code: ${processedZipCode}, Country: ${actualCountry}`, {
            userEnteredZip: processedZipCode,
            userEnteredCountry: actualCountry,
            originalZipParameter: zipCode,
            originalCountryParameter: country,
            guestUserId: guestUserId,
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
            itemCount: Object.keys(safeCartItems).length
        });
        
        fetch(route('cart.estimate-shipping'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                zip_code: processedZipCode,
                country: actualCountry,
            })
        })
        .then(async (response) => {
            console.debug(`📡 Shipping response received: ${response.status} ${response.statusText}`, { 
                status: response.status, 
                statusText: response.statusText 
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error(`❌ Shipping error response: ${data.error || 'Unknown shipping error'}`, {
                    error: data.error || 'Unknown shipping error',
                    message: data.message || '',
                    status: response.status,
                    statusText: response.statusText
                });
                
                Sentry.captureException(new Error(data.error || 'Shipping estimation failed'), {
                    tags: {
                        location: 'frontend',
                        component: 'CartIndex',
                        action: 'estimateShipping',
                        errorType: 'shipping_estimation',
                        userType: 'guest',
                        selectedCountry: country || 'none',
                        hasCountryBug: actualCountry !== country ? 'yes' : 'no'
                    },
                    extra: {
                        userEnteredZipCode: processedZipCode,
                        userEnteredCountry: actualCountry,
                        originalZipParameter: zipCode,
                        originalCountryParameter: country,
                        guestUserId: guestUserId,
                        totalItems: getTotalItems(),
                        totalPrice: getTotalPrice(),
                        itemCount: Object.keys(safeCartItems).length,
                        responseStatus: response.status,
                        responseData: JSON.stringify(data),
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    },
                    level: 'error'
                });
                
                throw new Error(data.error || 'Shipping estimation failed');
            }
            
            console.info(`✅ Shipping estimation successful: ${JSON.stringify(data)}`, {
                responseData: JSON.stringify(data),
                zipCode: zipCode,
                country: country,
                shippingOptions: data.shipping_options?.length || 0
            });
            
            setShippingError(null);
            const optionsText = data.shipping_options?.map((option: any) => 
                `${option.name}: $${option.cost} (${option.estimated_days})`
            ).join(', ') || 'No options available';
            
            setShippingSuccess(`Shipping estimated successfully! Options: ${optionsText}`);
            
            console.info(`📦 Available shipping options for ${zipCode}:`, {
                options: data.shipping_options,
                message: data.message
            });
        })
        .catch((error) => {
            console.error(`💥 Caught shipping error: ${error.message}`, { 
                errorMessage: error.message,
                errorName: error.name,
                errorStack: error.stack
            });
            setShippingError(error instanceof Error ? error.message : 'Shipping estimation failed');
        })
        .finally(() => {
            console.debug(`🏁 Shipping estimation finished for user: ${guestUserId}`, { guestUserId });
            setShippingProcessing(false);
        });
    };

    const handleCheckout = () => {
        console.log('Checking out:', {
            cartItemsCount: cartItemsArray.length,
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice()
        });
    };

    const getTotalPrice = () => {
        return Object.values(safeCartItems).reduce((total, item) => {
            return total + (item.product.price * item.quantity);
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
                                                            ${item.product.price}
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
                                                        Enter a coupon code to apply discount
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
                                            
                                            {/* Shipping Estimation Section */}
                                            <div className="border-t pt-4">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Estimate Shipping
                                                    </label>
                                                    
                                                    {/* Country Selection */}
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-600 dark:text-gray-400">
                                                            Country
                                                        </label>
                                                        <Select 
                                                            value={selectedCountry} 
                                                            onValueChange={(value) => {
                                                                setSelectedCountry(value);
                                                                setShippingError(null);
                                                                setShippingSuccess(null);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select a country" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="United States">United States</SelectItem>
                                                                <SelectItem value="Canada">Canada</SelectItem>
                                                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                                                <SelectItem value="Germany">Germany</SelectItem>
                                                                <SelectItem value="France">France</SelectItem>
                                                                <SelectItem value="Australia">Australia</SelectItem>
                                                                <SelectItem value="Japan">Japan</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    
                                                    {/* ZIP Code and Estimate Button */}
                                                    <div className="flex space-x-2">
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                                ZIP/Postal Code
                                                            </label>
                                                            <Input
                                                                type="text"
                                                                placeholder="Enter ZIP code"
                                                                className="mt-1"
                                                                id="zip-code"
                                                                maxLength={10}
                                                                onChange={() => {
                                                                    setShippingError(null);
                                                                    setShippingSuccess(null);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={shippingProcessing}
                                                                onClick={() => {
                                                                    const zipCode = (document.getElementById('zip-code') as HTMLInputElement)?.value;
                                                                    if (zipCode) {
                                                                        handleEstimateShipping(zipCode, selectedCountry);
                                                                    }
                                                                }}
                                                            >
                                                                Estimate
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Get shipping estimates for your location
                                                    </p>
                                                    
                                                    {/* Shipping Error Alert */}
                                                    {shippingError && (
                                                        <Alert variant="destructive">
                                                            <AlertCircleIcon />
                                                            <AlertTitle>Shipping Error</AlertTitle>
                                                            <AlertDescription>
                                                                {shippingError}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    {/* Shipping Success Alert */}
                                                    {shippingSuccess && (
                                                        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                                                            <AlertTitle>Shipping Estimated</AlertTitle>
                                                            <AlertDescription>
                                                                {shippingSuccess}
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
                                                onClick={handleCheckout}
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