import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
    category: string;
    is_active: boolean;
}

interface Props {
    products: Product[];
}

export default function Welcome({ products }: Props) {
    const { auth } = usePage<SharedData>().props;

    const addToCart = async (productId: number) => {
        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1,
                }),
            });
            
            if (response.ok) {
                // You might want to show a success message or update cart count
                alert('Product added to cart!');
            } else {
                alert('Failed to add product to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding to cart');
        }
    };

    return (
        <>
            <Head title="Dev Sticker Store">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
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
                                <Link href="/cart" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                    Cart
                                </Link>
                                {auth.user ? (
                                    <>
                                        <Link href="/orders" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                            Orders
                                        </Link>
                                        <Link href="/admin/products" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                            Admin
                                        </Link>
                                        <Link
                                            href={route('dashboard')}
                                            className="inline-block rounded-sm border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                                        >
                                            Dashboard
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="inline-block rounded-sm border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Developer Stickers
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Show your love for your favorite technologies with our premium sticker collection
                        </p>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Card key={product.id} className="overflow-hidden">
                                <CardHeader className="p-0">
                                    <img 
                                        src={product.image_url} 
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <CardTitle className="text-lg">{product.name}</CardTitle>
                                        <Badge variant="secondary">{product.category}</Badge>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-green-600">
                                            ${product.price}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {product.stock_quantity} in stock
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button 
                                        onClick={() => addToCart(product.id)}
                                        className="w-full"
                                        disabled={product.stock_quantity === 0}
                                    >
                                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No products available
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Check back later for our awesome sticker collection!
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
