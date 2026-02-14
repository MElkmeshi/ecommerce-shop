<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\ProductVariantController as AdminProductVariantController;
use App\Http\Controllers\Admin\VariantTypeController as AdminVariantTypeController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TelegramBotController;
use App\Http\Controllers\VariantTypeController;
use Illuminate\Support\Facades\Route;

// Public Routes (Product Browsing)
Route::get('/', [ProductController::class, 'index'])->name('home');
Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
Route::get('/cart', [CartController::class, 'index'])->name('cart');
Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');

// API Routes (for AJAX calls)
Route::get('/api/categories', [CategoryController::class, 'apiIndex'])->name('api.categories');
Route::get('/api/variant-types', [VariantTypeController::class, 'index'])->name('api.variant-types');
Route::get('/api/products/{id}/variants', [ProductController::class, 'getVariants'])->name('api.products.variants');

// Telegram Authenticated Routes
Route::middleware('telegram.auth')->group(function () {
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
});

// Admin Routes
Route::prefix('admin')->name('admin.')->group(function () {
    // Admin Auth (No middleware)
    Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AdminAuthController::class, 'login'])->name('login.post');

    // Protected Admin Routes
    Route::middleware('admin.auth')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');

        // Admin Dashboard
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Admin Pages
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::get('/variant-types', [AdminVariantTypeController::class, 'index'])->name('variant-types.index');
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');

        // Product Management API
        Route::get('/api/products', [AdminProductController::class, 'apiIndex'])->name('api.products.index');
        Route::post('/api/products', [AdminProductController::class, 'store'])->name('api.products.store');
        Route::put('/api/products/{id}', [AdminProductController::class, 'update'])->name('api.products.update');
        Route::delete('/api/products/{id}', [AdminProductController::class, 'destroy'])->name('api.products.destroy');

        // Category Management API
        Route::get('/api/categories', [AdminCategoryController::class, 'apiIndex'])->name('api.categories.index');
        Route::post('/api/categories', [AdminCategoryController::class, 'store'])->name('api.categories.store');
        Route::put('/api/categories/{id}', [AdminCategoryController::class, 'update'])->name('api.categories.update');
        Route::delete('/api/categories/{id}', [AdminCategoryController::class, 'destroy'])->name('api.categories.destroy');

        // Variant Type Management API
        Route::get('/api/variant-types', [AdminVariantTypeController::class, 'apiIndex'])->name('api.variant-types.index');
        Route::post('/api/variant-types', [AdminVariantTypeController::class, 'store'])->name('api.variant-types.store');
        Route::put('/api/variant-types/{id}', [AdminVariantTypeController::class, 'update'])->name('api.variant-types.update');
        Route::delete('/api/variant-types/{id}', [AdminVariantTypeController::class, 'destroy'])->name('api.variant-types.destroy');

        // Product Variant Management API
        Route::get('/api/products/{productId}/variants', [AdminProductVariantController::class, 'index'])->name('api.product-variants.index');
        Route::post('/api/products/{productId}/variants/generate', [AdminProductVariantController::class, 'generate'])->name('api.product-variants.generate');
        Route::put('/api/product-variants/{id}', [AdminProductVariantController::class, 'update'])->name('api.product-variants.update');
        Route::delete('/api/product-variants/{id}', [AdminProductVariantController::class, 'destroy'])->name('api.product-variants.destroy');

        // Order Management API
        Route::get('/api/orders', [AdminOrderController::class, 'apiIndex'])->name('api.orders.index');
        Route::patch('/api/orders/{id}/status', [AdminOrderController::class, 'updateStatus'])->name('api.orders.updateStatus');
    });
});

// Telegram Bot Webhook
Route::post('/telegram/webhook', [TelegramBotController::class, 'handleWebhook'])->name('telegram.webhook');
