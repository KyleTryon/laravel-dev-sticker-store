import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2 } from 'lucide-react';

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
}

export default function CartIndex({ cartItems }: Props) {
    const { patch, delete: destroy, processing } = useForm();

    // Ensure cartItems is always an object
    const safeCartItems = cartItems || {};

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