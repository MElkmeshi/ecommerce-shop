<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TelegramBotController;
use Illuminate\Support\Facades\Route;

// Public Routes (Product Browsing)
Route::get('/', [ProductController::class, 'index'])->name('home');
Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
Route::get('/cart', [CartController::class, 'index'])->name('cart');
Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');

// API Routes (for AJAX calls)
Route::get('/api/categories', [CategoryController::class, 'apiIndex'])->name('api.categories');

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

        // Order Management API
        Route::get('/api/orders', [AdminOrderController::class, 'apiIndex'])->name('api.orders.index');
        Route::patch('/api/orders/{id}/status', [AdminOrderController::class, 'updateStatus'])->name('api.orders.updateStatus');
    });
});

// Telegram Bot Webhook
Route::post('/telegram/webhook', [TelegramBotController::class, 'handleWebhook'])->name('telegram.webhook');
