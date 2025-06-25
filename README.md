# Dev Sticker Store 🚀

A modern ecommerce platform for developer stickers built with Laravel, React, and shadcn/ui components.

![Laravel](https://img.shields.io/badge/Laravel-12.x-red?logo=laravel)
![React](https://img.shields.io/badge/React-18+-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-teal?logo=tailwindcss)

## 🎯 Features

### 🛍️ Customer Features
- **Product Catalog**: Browse developer stickers with beautiful card layouts
- **Shopping Cart**: Session-based cart with quantity management
- **Responsive Design**: Mobile-first design with dark mode support
- **User Authentication**: Secure login and registration
- **Order History**: Track your purchases and order status
- **Mock Checkout**: Complete order processing (ready for payment integration)

### 👨‍💼 Admin Features
- **Product Management**: Add, edit, and manage product inventory
- **Order Management**: View and update order statuses
- **Stock Tracking**: Monitor inventory levels
- **Admin Dashboard**: Comprehensive management interface

### 🎨 UI/UX
- **Modern Design**: Built with shadcn/ui components
- **Responsive Layout**: Works perfectly on all devices
- **Dark Mode**: Toggle between light and dark themes
- **Fast Loading**: Optimized with Inertia.js for SPA experience

## 🛠️ Tech Stack

- **Backend**: Laravel 12.x with PHP 8.4
- **Frontend**: React 18+ with TypeScript
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Database**: SQLite (easily configurable to MySQL/PostgreSQL)
- **State Management**: Inertia.js
- **Build Tool**: Vite

## 📦 Sample Products

The store comes pre-loaded with 8 awesome developer stickers:

1. **Laravel Logo Sticker** - $4.99
2. **React Logo Sticker** - $3.99
3. **Vue.js Logo Sticker** - $3.99
4. **PHP Elephant Sticker** - $5.99
5. **JavaScript Logo Sticker Pack** - $12.99
6. **GitHub Octocat Sticker** - $4.49
7. **Docker Whale Sticker** - $3.49
8. **TypeScript Logo Sticker** - $4.99

## 🚀 Quick Start

### Prerequisites

- PHP 8.4+
- Node.js 18+
- Composer
- SQLite (or MySQL/PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dev-sticker-store
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database setup**
   ```bash
   # Create SQLite database
   touch database/database.sqlite
   
   # Run migrations
   php artisan migrate
   
   # Seed with sample products
   php artisan db:seed
   ```

6. **Build assets**
   ```bash
   # For development
   npm run dev
   
   # For production
   npm run build
   ```

7. **Start the application**
   ```bash
   php artisan serve
   ```

Visit `http://localhost:8000` to see your store!

## 📁 Project Structure

```
├── app/
│   ├── Http/Controllers/
│   │   ├── ProductController.php    # Product CRUD operations
│   │   └── OrderController.php      # Cart and order management
│   └── Models/
│       ├── Product.php              # Product model with relationships
│       ├── Order.php                # Order model with user relations
│       ├── OrderItem.php            # Order items linking
│       └── User.php                 # Extended user model
├── database/
│   ├── migrations/                  # Database schema
│   └── seeders/
│       └── ProductSeeder.php        # Sample product data
├── resources/
│   └── js/
│       └── pages/
│           ├── welcome.tsx          # Product listing homepage
│           ├── Cart/Index.tsx       # Shopping cart page
│           └── Admin/Products.tsx   # Admin product management
├── routes/
│   └── web.php                      # All application routes
└── README.md
```

## 🔧 Configuration

### Database Configuration

By default, the application uses SQLite. To use MySQL or PostgreSQL:

1. Update your `.env` file:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=dev_sticker_store
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

2. Run migrations:
   ```bash
   php artisan migrate:fresh --seed
   ```

### Environment Variables

Key environment variables to configure:

```env
APP_NAME="Dev Sticker Store"
APP_ENV=local
APP_KEY=base64:your-generated-key
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database/database.sqlite

MAIL_MAILER=smtp
# Configure for order confirmation emails
```

## 🛣️ API Routes

### Public Routes
- `GET /` - Product listing (homepage)
- `GET /products/{product}` - Product details
- `GET /cart` - Shopping cart
- `POST /cart/add` - Add item to cart
- `DELETE /cart/remove` - Remove item from cart
- `PATCH /cart/update` - Update cart quantities

### Authenticated Routes
- `POST /checkout` - Process order
- `GET /orders` - User order history
- `GET /orders/{order}` - Order details

### Admin Routes
- `GET /admin/products` - Product management
- `POST /admin/products` - Create product
- `PATCH /admin/products/{product}` - Update product
- `DELETE /admin/products/{product}` - Delete product
- `GET /admin/orders` - Order management
- `PATCH /admin/orders/{order}/status` - Update order status

## 🎨 Customization

### Adding New Products

1. **Via Admin Interface**: Visit `/admin/products` and use the "Add Product" form
2. **Via Seeder**: Add products to `database/seeders/ProductSeeder.php`
3. **Via API**: POST to `/admin/products` with product data

### Styling

The application uses Tailwind CSS with shadcn/ui components. Customize by:

1. **Tailwind Config**: Modify `tailwind.config.js`
2. **Component Styles**: Update shadcn components in `resources/js/components/ui/`
3. **Global Styles**: Edit `resources/css/app.css`

### Adding Payment Processing

To integrate real payments:

1. Install payment provider (Stripe, PayPal, etc.)
2. Update `OrderController@checkout` method
3. Add payment form components
4. Configure webhooks for payment confirmation

## 🧪 Testing

```bash
# Run PHP tests
php artisan test

# Run JavaScript tests
npm run test
```

## 📝 Development

### Adding New Features

1. **Backend**: Create controllers, models, and migrations in `app/`
2. **Frontend**: Add React components in `resources/js/`
3. **Routes**: Define in `routes/web.php`
4. **Database**: Create migrations with `php artisan make:migration`

### Code Style

- **PHP**: Follow PSR-12 standards
- **JavaScript/TypeScript**: ESLint configuration included
- **CSS**: Tailwind CSS utilities preferred

## 🔒 Security

- CSRF protection enabled on all forms
- Input validation in controllers
- SQL injection protection via Eloquent ORM
- XSS protection in Blade/React templates
- Authentication middleware for protected routes

## 🚀 Deployment

### Production Setup

1. **Environment**:
   ```bash
   APP_ENV=production
   APP_DEBUG=false
   ```

2. **Optimize**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   npm run build
   ```

3. **Database**:
   ```bash
   php artisan migrate --force
   ```

### Recommended Hosting

- **Laravel Forge** - Automated deployment
- **DigitalOcean** - VPS hosting
- **AWS** - Scalable cloud hosting
- **Vercel/Netlify** - For static frontend (if using API-only backend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## 🆘 Support

- **Documentation**: Check the `ECOMMERCE_IMPLEMENTATION.md` file for detailed implementation notes
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🎉 Acknowledgments

- Laravel team for the amazing framework
- React team for the powerful frontend library
- shadcn for the beautiful UI components
- Tailwind CSS for the utility-first styling
- Inertia.js for seamless SPA experience

---

**Happy coding! 🚀** Built with ❤️ for the developer community.