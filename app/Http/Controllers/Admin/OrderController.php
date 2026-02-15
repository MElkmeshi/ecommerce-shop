<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    /**
     * Display orders page.
     */
    public function index(): \Inertia\Response
    {
        return \Inertia\Inertia::render('admin/OrdersPage');
    }

    /**
     * Get all orders with details (API endpoint).
     */
    public function apiIndex(): JsonResponse
    {
        $orders = Order::with(['user', 'items.product.category'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders->map(function ($order) {
            return [
                'id' => $order->id,
                'customer' => $order->user?->getFullNameAttribute() ?? 'Unknown',
                'phone_number' => $order->phone_number,
                'location' => $order->location,
                'total_amount' => (float) ($order->total_amount ?? 0),
                'status' => $order->status,
                'created_at' => $order->created_at->toIso8601String(),
                'items' => $order->items->map(function ($item) {
                    return [
                        'product_name' => $item->product->name,
                        'quantity' => (int) ($item->quantity ?? 0),
                        'price' => (float) ($item->price ?? 0),
                    ];
                }),
            ];
        }));
    }

    /**
     * Update order status.
     */
    public function updateStatus(\Illuminate\Http\Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,completed,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return response()->json($order);
    }
}
