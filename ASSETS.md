# Static Assets Management

## 📁 Directory Structure

Static assets in this Laravel project are organized as follows:

```
public/
├── images/
│   ├── products/          # Product images (stickers, etc.)
│   ├── logos/            # Site logos and branding
│   └── icons/            # UI icons and graphics
├── css/                  # Compiled CSS files
├── js/                   # Compiled JavaScript files
└── storage/              # User uploads (symlinked from storage/app/public)
```

## 🖼️ Product Images

### Current Setup
- **Location**: `public/images/products/`
- **Format**: SVG (scalable, lightweight, perfect for logos)
- **Naming**: `{product-name}-sticker.svg`

### Adding New Product Images

1. **Upload your image** to `public/images/products/`
2. **Update the database** with the correct path:
   ```php
   'image_url' => '/images/products/your-image.svg'
   ```
3. **Run the seeder** to update the database:
   ```bash
   php artisan db:seed --class=ProductSeeder
   ```

### Image Guidelines

- **Recommended format**: SVG for logos, PNG/JPG for photos
- **Size**: 300x300px minimum for product images
- **File size**: Keep under 500KB for optimal loading
- **Naming**: Use kebab-case (e.g., `laravel-sticker.svg`)

## 🔗 URL Structure

### Local Assets
- **Path**: `/images/products/laravel-sticker.svg`
- **Full URL**: `http://localhost:8000/images/products/laravel-sticker.svg`

### External Assets
- **Use absolute URLs** for external images:
  ```php
  'image_url' => 'https://example.com/image.jpg'
  ```

## 🚀 Production Deployment

### CDN Setup
For production, consider using a CDN:

1. **Upload images** to your CDN (AWS S3, Cloudinary, etc.)
2. **Update image URLs** to use CDN domain
3. **Environment variables** for different environments:

```php
// .env
CDN_URL=https://your-cdn.com

// Usage
'image_url' => env('CDN_URL') . '/images/products/laravel-sticker.svg'
```

### Image Optimization
- **Compress images** before uploading
- **Use WebP format** for better compression
- **Implement lazy loading** for better performance

## 🛠️ File Upload System

For user-uploaded images, use Laravel's storage system:

```bash
# Create storage link
php artisan storage:link

# Upload to storage/app/public/images/
# Access via /storage/images/filename.jpg
```

## 📝 Example Usage

### In Blade Templates
```php
<img src="{{ asset('images/products/laravel-sticker.svg') }}" alt="Laravel Sticker">
```

### In React Components
```jsx
<img src="/images/products/laravel-sticker.svg" alt="Laravel Sticker" />
```

### In Database Seeders
```php
'image_url' => '/images/products/laravel-sticker.svg'
```

## 🔧 Troubleshooting

### Images Not Loading
1. **Check file permissions**: Ensure `public/images/` is readable
2. **Verify file paths**: Use absolute paths from `public/`
3. **Clear cache**: `php artisan cache:clear`
4. **Check browser console**: Look for 404 errors

### Broken Links
1. **Verify file exists**: Check `public/images/products/`
2. **Check URL format**: Should start with `/`
3. **Test direct access**: Try `http://localhost:8000/images/products/filename.svg`

## 📚 Additional Resources

- [Laravel Asset Management](https://laravel.com/docs/asset-compilation)
- [Laravel Storage](https://laravel.com/docs/filesystem)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images) 