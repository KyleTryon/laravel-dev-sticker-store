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
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [selectedShippingOption, setSelectedShippingOption] = useState<any>(null);
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState('');
    const [localCartItems, setLocalCartItems] = useState(cartItems || {});

    // Ensure cartItems is always an object - use local state for real-time updates
    const safeCartItems = localCartItems || {};

    // Sync local state with props when cartItems change
    useEffect(() => {
        setLocalCartItems(cartItems || {});
    }, [cartItems]);

    // Track cart page view
    useEffect(() => {
        console.log('🔍 Cart useEffect starting...'); // DEBUG
        
        // Set user context for all Sentry events
        const userId = getUserId();
        console.log('🔍 Setting user:', userId); // DEBUG
        Sentry.setUser({ id: userId });
        
        console.log('🔍 Creating cart_view span...'); // DEBUG
        Sentry.startSpan({
            name: "cart_view",
            op: "commerce.cart.view",
            attributes: {
                'cart_items': getTotalItems(),
                'cart_value': getSubtotal(),
                'currency': 'USD'
            }
        }, () => {
            console.info('🛒 Cart page viewed - span created!');
        });
        
        console.log('🔍 Cart useEffect completed!'); // DEBUG
    }, []);

    // Generate or retrieve user ID
    const getUserId = (): string => {
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

    const clearCart = async () => {
        try {
            const response = await fetch(route('cart.clear'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Cart cleared successfully:', data);
                
                // Update local state to reflect empty cart
                setLocalCartItems({});
                
                // Reset shipping options and selections since cart is empty
                setShippingOptions([]);
                setSelectedShippingOption(null);
                setSelectedCountry('');
                setShippingSuccess(null);
                setShippingError(null);
                
                return data;
            } else {
                throw new Error('Failed to clear cart');
            }
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
            throw error;
        }
    };

    const handleApplyCoupon = (couponCode: string) => {
        console.info(`🛒 handleApplyCoupon called with coupon code: ${couponCode}`, { couponCode });
        setCouponError(null); // Clear any previous errors
        setCouponProcessing(true);
        
        const guestUserId = getUserId();
        console.debug(`👤 Guest user ID: ${guestUserId}`, { guestUserId });
        
        // Log cart information for context
        console.debug(`🛍️ Cart information: ${getTotalItems()} items, $${getSubtotal().toFixed(2)} total`, {
            cartItems: JSON.stringify(safeCartItems),
            totalItems: getTotalItems(),
            totalPrice: getSubtotal(),
            itemCount: Object.keys(safeCartItems).length
        });
        
        const actualCouponCode = couponCode;
        
        console.warn(`🛒 Applying Coupon Code: ${actualCouponCode}`, {
            userEnteredCode: actualCouponCode,
            originalParameter: couponCode,
            guestUserId: guestUserId,
            totalItems: getTotalItems(),
            totalPrice: getSubtotal(),
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
                        totalPrice: getSubtotal(),
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
        
        // Track shipping cost estimation with Sentry
        Sentry.startSpan({
            name: "Shipping Cost Estimation",
            op: "commerce.shipping.estimate",
            attributes: {
                'shipping.country': country,
                'shipping.zip_code': zipCode,
                'shipping.is_us_canada': (country === 'United States' || country === 'Canada'),
                'cart.total_items': getTotalItems(),
                'cart.total_value': getSubtotal(),
                'cart.unique_products': Object.keys(safeCartItems).length,
                'user.type': 'guest',
                'session.timestamp': new Date().toISOString(),
            }
        }, async () => {
            setShippingError(null); // Clear any previous errors
            setShippingSuccess(null); // Clear any previous success messages
            setShippingProcessing(true);
            
            const guestUserId = getUserId();
            console.debug(`👤 Guest user ID for shipping: ${guestUserId}`, { guestUserId });
            
            // Log cart information for context
            console.debug(`🛍️ Shipping estimation for cart: ${getTotalItems()} items, $${getSubtotal().toFixed(2)} total`, {
                cartItems: JSON.stringify(safeCartItems),
                totalItems: getTotalItems(),
                totalPrice: getSubtotal(),
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
            totalPrice: getSubtotal(),
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
                        totalPrice: getSubtotal(),
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
            const options = data.shipping_options || [];
            setShippingOptions(options);
            
            // Automatically select the first (typically cheapest) shipping option
            if (options.length > 0) {
                setSelectedShippingOption(options[0]);
                setShippingSuccess(`${options[0].name} ($${options[0].cost.toFixed(2)}) has been automatically selected. Change options below if needed.`);
            } else {
                setShippingSuccess(`Shipping options available! Please select your preferred shipping method below.`);
            }
            
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
        });
    };

    const handleCheckout = async () => {
        if (checkoutProcessing) return;
        
        setCheckoutProcessing(true);
        
        // Checkout span
        return Sentry.startSpan({
            name: "checkout",
            op: "commerce.checkout",
            attributes: {
                'checkout.status': 'in_progress',
                'cart_items': getTotalItems(),
                'cart_value': getTotalPrice(),
                'currency': 'USD'
            }
        }, async (span) => {
            try {
                console.log('🛍️ Full checkout process initiated:', {
                    cartItemsCount: cartItemsArray.length,
                    totalItems: getTotalItems(),
                    subtotal: getSubtotal(),
                    shippingCost: selectedShippingOption?.cost || 0,
                    totalPrice: getTotalPrice(),
                    selectedCountry: selectedCountry,
                    selectedShippingOption: selectedShippingOption?.name || 'none',
                    timestamp: new Date().toISOString()
                });

                // Step 1: Checkout Validation
                setCheckoutStep('Validating order...');
                await Sentry.startSpan({
                    name: "Checkout Validation",
                    op: "commerce.checkout.validate",
                    attributes: {
                        'validation.cart_items': getTotalItems(),
                        'validation.shipping_selected': !!selectedShippingOption,
                        'validation.country_selected': !!selectedCountry,
                        'validation.step': 'pre_payment'
                    }
                }, async () => {
                    console.log('✅ Step 1: Validating checkout data...');
                    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate validation time
                    
                    // Simulate validation checks
                    if (getTotalItems() === 0) throw new Error('Cart is empty');
                    if (!selectedShippingOption) throw new Error('No shipping option selected');
                    
                    console.log('✅ Checkout validation passed');
                });

                // Step 2: Payment Processing
                setCheckoutStep('Processing payment...');
                const paymentResult = await Sentry.startSpan({
                    name: "Payment Processing",
                    op: "commerce.payment.process",
                    attributes: {
                        'payment.amount': getTotalPrice(),
                        'payment.currency': 'USD',
                        'payment.method': 'demo_card',
                        'payment.provider': 'demo_stripe',
                        'payment.shipping_amount': selectedShippingOption?.cost || 0,
                        'payment.tax_amount': 0
                    }
                }, async () => {
                    console.log('💳 Step 2: Processing payment...');
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate payment processing
                    
                    const paymentId = `pay_demo_${Date.now()}`;
                    
                    // Simulate payment success/failure (95% success rate for demo)
                    if (Math.random() < 0.95) {
                        console.log('💳 Payment processed successfully:', paymentId);
                        return {
                            success: true,
                            payment_id: paymentId,
                            amount: getTotalPrice(),
                            currency: 'USD'
                        };
                    } else {
                        throw new Error('Payment declined - demo failure');
                    }
                });

                // Step 3: Order Creation
                setCheckoutStep('Creating order...');
                const orderResult = await Sentry.startSpan({
                    name: "Order Creation",
                    op: "commerce.order.create",
                    attributes: {
                        'order.payment_id': paymentResult.payment_id,
                        'order.total_amount': getTotalPrice(),
                        'order.item_count': getTotalItems(),
                        'order.shipping_method': selectedShippingOption?.name || 'none',
                        'order.shipping_cost': selectedShippingOption?.cost || 0,
                        'order.customer_type': 'guest'
                    }
                }, async () => {
                    console.log('📋 Step 3: Creating order...');
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate order creation
                    
                    const orderId = `order_demo_${Date.now()}`;
                    
                    console.log('📋 Order created successfully:', orderId);
                    return {
                        order_id: orderId,
                        status: 'confirmed',
                        payment_id: paymentResult.payment_id,
                        total: getTotalPrice(),
                        items: cartItemsArray.map(item => ({
                            product_id: item.product.id,
                            name: item.product.name,
                            quantity: item.quantity,
                            price: item.product.price
                        })),
                        shipping: {
                            method: selectedShippingOption?.name,
                            cost: selectedShippingOption?.cost,
                            estimated_delivery: selectedShippingOption?.estimated_days
                        }
                    };
                });

                // Step 4: Post-order Processing (inventory, notifications, etc.)
                setCheckoutStep('Finalizing order...');
                await Sentry.startSpan({
                    name: "Post-Order Processing",
                    op: "commerce.order.post_process",
                    attributes: {
                        'order.id': orderResult.order_id,
                        'processing.inventory_update': true,
                        'processing.email_confirmation': true,
                        'processing.analytics_tracking': true
                    }
                }, async () => {
                    console.log('📬 Step 4: Post-order processing...');
                    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate post-processing
                    
                    console.log('📬 Inventory updated, confirmation email queued');
                });

                // Success!
                console.log('🎉 Checkout completed successfully!', {
                    orderId: orderResult.order_id,
                    paymentId: paymentResult.payment_id,
                    total: getTotalPrice(),
                    timestamp: new Date().toISOString()
                });

                // Step 5: Clear the cart after successful order
                setCheckoutStep('Clearing cart...');
                await Sentry.startSpan({
                    name: "Cart Clearing",
                    op: "commerce.cart.clear",
                    attributes: {
                        'cart.items_before_clear': getTotalItems(),
                        'cart.value_before_clear': getTotalPrice(),
                        'order.id': orderResult.order_id,
                        'clear.reason': 'successful_checkout'
                    }
                }, async () => {
                    console.log('🧹 Step 5: Clearing cart after successful order...');
                    await clearCart();
                    console.log('✅ Cart cleared successfully');
                });

                setCheckoutSuccess(true);
                
                // Update span status for successful conversion
                span.setAttributes({
                    'checkout.status': 'completed',
                    'order.id': orderResult.order_id
                });
                
            } catch (error) {
                console.error('❌ Checkout failed:', error);
                
                Sentry.captureException(error, {
                    tags: {
                        checkout_step: 'payment_or_validation',
                        total_value: getTotalPrice(),
                        cart_items: getTotalItems()
                    },
                    extra: {
                        selectedCountry,
                        selectedShipping: selectedShippingOption?.name,
                        cartContents: cartItemsArray
                    }
                });
                
                throw error;
            } finally {
                setCheckoutProcessing(false);
                setCheckoutStep('');
            }
        });
    };

    const getSubtotal = () => {
        return Object.values(safeCartItems).reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    };

    const getTotalPrice = () => {
        const subtotal = getSubtotal();
        const shippingCost = selectedShippingOption?.cost || 0;
        return subtotal + shippingCost;
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

                    {cartItemsArray.length === 0 || checkoutSuccess ? (
                        <div className="text-center py-12">
                            {checkoutSuccess ? (
                                <>
                                    <div className="flex justify-center mb-4">
                                        <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Order Completed Successfully!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Your order has been processed and your cart has been cleared. Thank you for shopping with us!
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Your cart is empty
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Add some awesome stickers to get started!
                                    </p>
                                </>
                            )}
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
                                {/* Checkout Progress Indicator */}
                                {checkoutProcessing && (
                                    <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                <div>
                                                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                                                        Processing Your Order
                                                    </h3>
                                                    <p className="text-sm text-blue-700 dark:text-blue-200">
                                                        {checkoutStep || 'Please wait...'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span>Subtotal ({getTotalItems()} items)</span>
                                                <span>${getSubtotal().toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Shipping</span>
                                                <span className={selectedShippingOption ? 'text-green-600 font-medium' : 'text-gray-500 text-sm'}>
                                                    {selectedShippingOption ? `$${selectedShippingOption.cost.toFixed(2)}` : 'Calculate below'}
                                                </span>
                                            </div>
                                            
                                            {/* Shipping Estimation Section - Moved here for better UX flow */}
                                            <div className="border-t pt-4">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Calculate Shipping
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
                                                                setShippingOptions([]);
                                                                setSelectedShippingOption(null);
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
                                                    
                                                    {/* ZIP Code and Calculate Button */}
                                                    <div className="flex space-x-2">
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                                {selectedCountry === 'Canada' ? 'Postal Code' : 'ZIP Code'}
                                                            </label>
                                                            <Input
                                                                type="text"
                                                                placeholder={
                                                                    selectedCountry === 'Canada' ? 'K1A 0A6' : 
                                                                    selectedCountry === 'United States' ? '12345' :
                                                                    'Enter postal code'
                                                                }
                                                                className="mt-1 shipping-input"
                                                                id="zip-code"
                                                                maxLength={10}
                                                                onChange={() => {
                                                                    setShippingError(null);
                                                                    setShippingSuccess(null);
                                                                    setShippingOptions([]);
                                                                    setSelectedShippingOption(null);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={shippingProcessing || !selectedCountry}
                                                                onClick={() => {
                                                                    const zipCode = (document.getElementById('zip-code') as HTMLInputElement)?.value;
                                                                    if (zipCode && selectedCountry) {
                                                                        handleEstimateShipping(zipCode, selectedCountry);
                                                                    }
                                                                }}
                                                            >
                                                                {shippingProcessing ? 'Calculating...' : 'Calculate'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
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
                                                            <AlertTitle>Shipping Available</AlertTitle>
                                                            <AlertDescription>
                                                                {shippingSuccess}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    {/* Shipping Options Selection */}
                                                    {shippingOptions.length > 0 && (
                                                        <div className="mt-4">
                                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                                                                Choose Shipping Method
                                                            </label>
                                                            <div className="space-y-2">
                                                                {shippingOptions.map((option, index) => (
                                                                    <div 
                                                                        key={index} 
                                                                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                            selectedShippingOption?.name === option.name
                                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                                        }`}
                                                                        onClick={() => setSelectedShippingOption(option)}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            id={`shipping-${index}`}
                                                                            name="shipping"
                                                                            value={index}
                                                                            checked={selectedShippingOption?.name === option.name}
                                                                            onChange={() => setSelectedShippingOption(option)}
                                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="flex justify-between items-center">
                                                                                <div>
                                                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                                                        {option.name}
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                        {option.estimated_days}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="font-bold text-blue-600">
                                                                                    ${option.cost.toFixed(2)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                                            
                                            
                                            <div className="border-t pt-4">
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total</span>
                                                    <span>${getTotalPrice().toFixed(2)}</span>
                                                </div>
                                                {selectedShippingOption && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Includes ${selectedShippingOption.cost.toFixed(2)} shipping via {selectedShippingOption.name}
                                                    </p>
                                                )}
                                            </div>
                                            {!checkoutSuccess ? (
                                                <Button 
                                                    className="w-full" 
                                                    size="lg"
                                                    disabled={processing || checkoutProcessing}
                                                    onClick={handleCheckout}
                                                >
                                                    {checkoutProcessing ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>{checkoutStep || 'Processing...'}</span>
                                                        </div>
                                                    ) : selectedShippingOption ? (
                                                        `Checkout • $${getTotalPrice().toFixed(2)}`
                                                    ) : (
                                                        'Proceed to Checkout'
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="text-center space-y-3">
                                                    <div className="flex items-center justify-center space-x-2 text-green-600">
                                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="font-semibold">Order Completed!</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Thank you for your purchase! Your order has been processed successfully and your cart has been cleared.
                                                    </p>
                                                    <Button 
                                                        className="w-full" 
                                                        size="lg"
                                                        variant="outline"
                                                        onClick={() => window.location.href = '/'}
                                                    >
                                                        Continue Shopping
                                                    </Button>
                                                </div>
                                            )}
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