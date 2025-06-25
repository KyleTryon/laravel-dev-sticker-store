import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

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

export default function AdminProducts({ products }: Props) {
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        price: '',
        image_url: '',
        stock_quantity: '',
        category: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/products', {
            onSuccess: () => {
                reset();
                setIsAddingProduct(false);
            },
        });
    };

    const toggleProductStatus = (product: Product) => {
        // Submit form to update product status
        // This would be implemented with a proper form submission
    };

    return (
        <>
            <Head title="Admin - Products" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <header className="bg-white shadow-sm dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                                    Dev Sticker Store - Admin
                                </Link>
                            </div>
                            <nav className="flex items-center space-x-4">
                                <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                    Store
                                </Link>
                                <Link href="/admin/orders" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                    Orders
                                </Link>
                                <span className="text-blue-600 font-medium">Products</span>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Product Management
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Manage your sticker inventory
                            </p>
                        </div>
                        <Button onClick={() => setIsAddingProduct(!isAddingProduct)}>
                            {isAddingProduct ? 'Cancel' : 'Add Product'}
                        </Button>
                    </div>

                    {/* Add Product Form */}
                    {isAddingProduct && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Add New Product</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Product Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
                                        </div>
                                        <div>
                                            <Label htmlFor="category">Category</Label>
                                            <Input
                                                id="category"
                                                value={data.category}
                                                onChange={(e) => setData('category', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="price">Price</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                value={data.price}
                                                onChange={(e) => setData('price', e.target.value)}
                                                required
                                            />
                                            {errors.price && <div className="text-red-500 text-sm">{errors.price}</div>}
                                        </div>
                                        <div>
                                            <Label htmlFor="stock_quantity">Stock Quantity</Label>
                                            <Input
                                                id="stock_quantity"
                                                type="number"
                                                value={data.stock_quantity}
                                                onChange={(e) => setData('stock_quantity', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="image_url">Image URL</Label>
                                            <Input
                                                id="image_url"
                                                type="url"
                                                value={data.image_url}
                                                onChange={(e) => setData('image_url', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="description">Description</Label>
                                            <textarea
                                                id="description"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                required
                                            />
                                            {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Adding...' : 'Add Product'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Products List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <Card key={product.id}>
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
                                        <Badge variant={product.is_active ? "default" : "secondary"}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-green-600">
                                                ${product.price}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                Stock: {product.stock_quantity}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="flex-1"
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                variant={product.is_active ? "secondary" : "default"}
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => toggleProductStatus(product)}
                                            >
                                                {product.is_active ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No products yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Add your first product to get started!
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}