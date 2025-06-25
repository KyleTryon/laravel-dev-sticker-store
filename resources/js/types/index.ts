export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    category?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: number;
    user_id: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    shipping_address: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: number;
    product: Product;
}

export interface CartItem {
    product_id: number;
    quantity: number;
    product: Product;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
} 