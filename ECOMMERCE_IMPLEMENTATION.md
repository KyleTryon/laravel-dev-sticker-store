# Dev Sticker Store - Laravel/React Ecommerce Implementation

## Overview
This project implements a complete ecommerce solution for selling developer stickers using Laravel backend with React/Inertia.js frontend and shadcn/ui components.

## What's Been Implemented

### Backend (Laravel)

#### Database Structure
- **Products Table**: Stores product information including name, description, price, image URL, stock quantity, category, and active status
- **Orders Table**: Manages customer orders with user relationships, total amounts, status tracking, shipping addresses, and payment information
- **Order Items Table**: Links products to orders with quantities and prices
- **User Table**: Extended with order relationships

#### Models
- **Product Model**: Includes fillable fields, type casting, and order item relationships
- **Order Model**: Manages order data with user and order item relationships, JSON casting for shipping addresses
- **OrderItem Model**: Links products to orders with proper relationships
- **User Model**: Extended with order relationships

#### Controllers
- **ProductController**: 
  - `index()`: Lists active products for the store front
  - `show()`: Shows individual product details
  - `admin()`: Admin view of all products
  - `store()`: Creates new products (admin)
  - `update()`: Updates existing products (admin)
  - `destroy()`: Deletes products (admin)

- **OrderController**:
  - `cart()`: Displays shopping cart
  - `addToCart()`: Adds products to session-based cart
  - `removeFromCart()`: Removes items from cart
  - `updateCartQuantity()`: Updates item quantities
  - `checkout()`: Processes orders and creates database records
  - `index()`: Lists user's orders
  - `show()`: Shows order details
  - `admin()`: Admin view of all orders
  - `updateStatus()`: Updates order status (admin)

#### Routes
- **Public Routes**: Home page (product listing), product details, cart management
- **Authenticated Routes**: Checkout, order history, order details
- **Admin Routes**: Product management, order management

#### Database Seeder
- **ProductSeeder**: Populates the database with 8 sample developer stickers including Laravel, React, Vue.js, PHP, JavaScript, GitHub, Docker, and TypeScript stickers

### Frontend (React/Inertia.js)

#### Main Store Pages
- **Welcome/Home Page** (`resources/js/pages/welcome.tsx`): 
  - Product grid with cards showing images, names, descriptions, prices, and stock
  - Add to cart functionality
  - Category badges
  - Modern, responsive design with dark mode support

- **Cart Page** (`resources/js/pages/Cart/Index.tsx`):
  - Session-based cart management
  - Quantity adjustment controls
  - Remove item functionality
  - Order summary with shipping calculation
  - Checkout button

#### Admin Interface
- **Admin Products Page** (`resources/js/pages/Admin/Products.tsx`):
  - Product listing with management controls
  - Add new product form with validation
  - Edit/activate/deactivate products
  - Stock monitoring

#### UI Components
All pages use shadcn/ui components for consistent, modern design:
- Card components for product display
- Button components with variants
- Input and form components
- Badge components for categories and status
- Responsive grid layouts
- Dark mode support

### Key Features Implemented

#### Shopping Cart
- Session-based cart storage
- Add/remove/update quantities
- Real-time total calculation
- Stock quantity validation
- Persistent cart across page loads

#### Product Management
- Full CRUD operations for products
- Image URL support
- Category organization
- Stock quantity tracking
- Active/inactive status

#### Order Processing
- Mock checkout process
- Order creation with order items
- Stock quantity updates on purchase
- Order status tracking
- User order history

#### Admin Dashboard
- Product management interface
- Order status management
- Inventory monitoring
- Add new products

### Database Schema

```sql
-- Products table
CREATE TABLE products (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255) NULLABLE,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(255) NULLABLE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Orders table  
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT FOREIGN KEY REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address JSON NOT NULL,
    payment_method VARCHAR(255) DEFAULT 'credit_card',
    payment_status VARCHAR(255) DEFAULT 'pending',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Order Items table
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY,
    order_id BIGINT FOREIGN KEY REFERENCES orders(id),
    product_id BIGINT FOREIGN KEY REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Sample Products Included
1. Laravel Logo Sticker - $4.99
2. React Logo Sticker - $3.99  
3. Vue.js Logo Sticker - $3.99
4. PHP Elephant Sticker - $5.99
5. JavaScript Logo Sticker Pack - $12.99
6. GitHub Octocat Sticker - $4.49
7. Docker Whale Sticker - $3.49
8. TypeScript Logo Sticker - $4.99

## Next Steps To Complete

### Required Setup
1. **Database Migration**: Run `php artisan migrate` to create the database tables
2. **Seed Database**: Run `php artisan db:seed` to populate sample products
3. **Install Dependencies**: Ensure all Laravel and Node.js dependencies are installed
4. **Configure Database**: Set up SQLite database file
5. **Build Frontend**: Run `npm run build` or `npm run dev` for development

### Additional Features to Add
1. **Payment Integration**: Add real payment processing (Stripe, PayPal)
2. **Image Upload**: Implement file upload for product images
3. **User Authentication**: Ensure proper authentication middleware
4. **Email Notifications**: Order confirmation and status update emails
5. **Search and Filtering**: Product search and category filtering
6. **Reviews and Ratings**: Customer product reviews
7. **Inventory Alerts**: Low stock notifications
8. **Shipping Integration**: Real shipping cost calculation
9. **Discount Codes**: Coupon and promotion system
10. **Analytics**: Sales reporting and analytics dashboard

### Security Considerations
- CSRF protection is implemented in forms
- User authentication for checkout and admin
- Input validation in controllers
- SQL injection protection through Eloquent ORM
- XSS protection in templates

## Technology Stack
- **Backend**: Laravel 12.x with PHP 8.4
- **Frontend**: React 18+ with TypeScript
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Database**: SQLite (configurable to MySQL/PostgreSQL)
- **State Management**: Inertia.js for seamless SPA experience
- **Form Handling**: Laravel form validation with Inertia.js

## File Structure
```
├── app/
│   ├── Http/Controllers/
│   │   ├── ProductController.php
│   │   └── OrderController.php
│   └── Models/
│       ├── Product.php
│       ├── Order.php
│       ├── OrderItem.php
│       └── User.php
├── database/
│   ├── migrations/
│   │   ├── create_products_table.php
│   │   ├── create_orders_table.php
│   │   └── create_order_items_table.php
│   └── seeders/
│       ├── ProductSeeder.php
│       └── DatabaseSeeder.php
├── resources/
│   └── js/
│       └── pages/
│           ├── welcome.tsx (Product listing)
│           ├── Cart/Index.tsx
│           └── Admin/Products.tsx
└── routes/
    └── web.php (All routes defined)
```

This implementation provides a solid foundation for a modern ecommerce store with room for expansion and customization.