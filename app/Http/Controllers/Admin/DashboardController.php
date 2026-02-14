<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'totalProducts' => Product::count(),
            'totalCategories' => Category::count(),
            'totalOrders' => Order::count(),
            'totalRevenue' => Order::where('status', 'completed')->sum('total_amount'),
        ];

        return Inertia::render('admin/DashboardPage', [
            'stats' => $stats,
        ]);
    }
}
