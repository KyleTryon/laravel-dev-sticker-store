import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Package, CheckCircle, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';

interface Props {
    products: Product[];
    cart: { [key: number]: { quantity: number } };
    cartCount: number;
}

export default function ProductsIndex({ products, cart, cartCount: initialCartCount }: Props) {
    const { processing, errors } = useForm();
    const { flash } = usePage().props as any;
    
    // State to track quantity for each product
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    // State to track which products are in cart
    const [productsInCart, setProductsInCart] = useState<{ [key: number]: boolean }>({});
    // State for cart count badge
    const [cartCount, setCartCount] = useState<number>(initialCartCount || 0);
    // State to track which products are currently being added to cart (prevents rage clicking)
    const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});

    // Initialize state from cart prop on mount
    useEffect(() => {
        if (cart) {
            const initialQuantities: { [key: number]: number } = {};
            const initialProductsInCart: { [key: number]: boolean } = {};
            Object.entries(cart).forEach(([productId, item]) => {
                initialQuantities[Number(productId)] = item.quantity;
                initialProductsInCart[Number(productId)] = true;
            });
            setQuantities(initialQuantities);
            setProductsInCart(initialProductsInCart);
            setCartCount(Object.values(initialQuantities).reduce((sum, q) => sum + q, 0));
        }
    }, [cart]);

    const addToCart = (productId: number) => {
        // Prevent multiple concurrent requests for the same product
        if (addingToCart[productId]) {
            console.log(`[Cart] Already adding product ${productId} to cart, ignoring duplicate request`);
            return;
        }

        const quantity = quantities[productId] || 1;
        const data = {
            product_id: productId,
            quantity: quantity,
        };
        
        console.log(`[Cart] Adding to cart: Product ID ${productId}, Quantity ${quantity}`);
        setAddingToCart(prev => ({ ...prev, [productId]: true }));
        
        router.post(route('cart.add'), data, {
            onSuccess: () => {
                setProductsInCart(prev => ({ ...prev, [productId]: true }));
                setQuantities(prev => ({ ...prev, [productId]: quantity }));
                setCartCount(prev => prev + quantity);
                setAddingToCart(prev => ({ ...prev, [productId]: false }));
            },
            onError: () => {
                setAddingToCart(prev => ({ ...prev, [productId]: false }));
            }
        });
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity < 0) return;
        const product = products.find(p => p.id === productId);
        if (product && newQuantity > product.stock_quantity) return;
        // Send PATCH request to update cart
        router.patch(route('cart.update'), {
            product_id: productId,
            quantity: newQuantity,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
                if (newQuantity === 0) {
                    setProductsInCart(prev => ({ ...prev, [productId]: false }));
                } else {
                    setProductsInCart(prev => ({ ...prev, [productId]: true }));
                }
                setCartCount(Object.values({ ...quantities, [productId]: newQuantity }).reduce((sum, q) => sum + q, 0));
            }
        });
    };

    const getQuantity = (productId: number) => {
        return quantities[productId] || 0;
    };

    const isInCart = (productId: number) => {
        return productsInCart[productId] || false;
    };

    return (
        <>
            <Head title="Dev Sticker Store" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {/* Header */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Package className="h-8 w-8 text-blue-600" />
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Dev Sticker Store
                                    </h1>
                                </div>
                                <Badge variant="secondary" className="hidden sm:inline-flex">
                                    Premium Developer Stickers
                                </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <Link href={route('cart')}>
                                    <Button variant="outline" size="sm" className="relative">
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Cart
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Success/Error Messages */}
                {flash?.success && (
                    <div className="container mx-auto px-4 py-2">
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5" />
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                
                {errors.stock && (
                    <div className="container mx-auto px-4 py-2">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {errors.stock}
                        </div>
                    </div>
                )}

                {/* Hero Section */}
                <section className="py-16 px-4">
                    <div className="container mx-auto text-center">
                        <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                            Premium Developer Stickers
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                            Show off your tech stack with our high-quality, durable stickers. 
                            Perfect for laptops, water bottles, and anywhere you want to display your developer pride.
                        </p>
                        <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>Premium Quality</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4" />
                                <span>Fast Shipping</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="py-8 px-4">
                    <div className="container mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
                                    <CardHeader className="pb-3">
                                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="text-4xl font-bold text-slate-400 dark:text-slate-500">
                                                    {product.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {product.name}
                                        </CardTitle>
                                        <CardDescription className="text-slate-600 dark:text-slate-300 line-clamp-2">
                                            {product.description}
                                        </CardDescription>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                ${product.price}
                                            </div>
                                            <Badge 
                                                variant={product.stock_quantity > 0 ? "default" : "destructive"}
                                                className="text-xs"
                                            >
                                                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                            </Badge>
                                        </div>
                                        
                                        {product.category && (
                                            <Badge variant="outline" className="mb-4 text-xs">
                                                {product.category}
                                            </Badge>
                                        )}
                                    </CardContent>
                                    
                                    <CardFooter className="pt-0">
                                        {isInCart(product.id) ? (
                                            <div className="flex w-full items-center gap-2">
                                                <div className="flex items-center border rounded-md">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => updateQuantity(product.id, getQuantity(product.id) - 1)}
                                                        disabled={processing}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                                                        {getQuantity(product.id)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => updateQuantity(product.id, getQuantity(product.id) + 1)}
                                                        disabled={processing}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button 
                                                onClick={() => addToCart(product.id)}
                                                disabled={product.stock_quantity === 0 || processing || addingToCart[product.id]}
                                                className="w-full"
                                                size="sm"
                                            >
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                {addingToCart[product.id] ? 'Adding...' : processing ? 'Adding...' : 'Add to Cart'}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 px-4 bg-white dark:bg-slate-900">
                    <div className="container mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Premium Quality
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300">
                                    High-quality vinyl stickers that last for years without fading or peeling.
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Fast Shipping
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300">
                                    Quick delivery worldwide with tracking included on all orders.
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Easy Returns
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300">
                                    30-day money-back guarantee if you're not completely satisfied.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12 px-4">
                    <div className="container mx-auto text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <Package className="h-6 w-6 text-blue-400" />
                            <h3 className="text-xl font-bold">Dev Sticker Store</h3>
                        </div>
                        <p className="text-slate-400 mb-4">
                            Premium developer stickers for the modern coder
                        </p>
                        <div className="text-sm text-slate-500">
                            © 2024 Dev Sticker Store. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
} 