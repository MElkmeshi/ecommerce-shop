<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateOrderRequest;
use App\Services\DeliveryFeeCalculator;
use App\Services\GoogleMapsService;
use App\Services\OrderService;
use App\Settings\AppSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly GoogleMapsService $mapsService,
        private readonly DeliveryFeeCalculator $feeCalculator,
        private readonly AppSettings $settings
    ) {}

    /**
     * Store a newly created order.
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            $telegramUser = $request->input('telegram_user');
            $orderData = $request->validated();

            $order = $this->orderService->createOrder($orderData, $telegramUser);

            return response()->json([
                'success' => true,
                'order' => [
                    'id' => $order->id,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                ],
            ], 201);
        } catch (\App\Exceptions\InsufficientStockException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to create order',
            ], 500);
        }
    }

    /**
     * Display the user's order history.
     */
    public function index(Request $request): Response
    {
        $telegramUser = $request->input('telegram_user');
        $orders = $this->orderService->getUserOrders($telegramUser['id']);

        return Inertia::render('OrdersPage', [
            'orders' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'phone_number' => $order->phone_number,
                    'location' => $order->location,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_name' => $item->product->name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'subtotal' => $item->subtotal,
                        ];
                    }),
                ];
            }),
        ]);
    }

    /**
     * Calculate delivery fee based on coordinates.
     */
    public function calculateDeliveryFee(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric|min:-90|max:90',
            'longitude' => 'required|numeric|min:-180|max:180',
        ]);

        $distance = $this->mapsService->calculateDistance(
            $this->settings->store_latitude,
            $this->settings->store_longitude,
            $request->input('latitude'),
            $request->input('longitude')
        );

        if ($distance === null) {
            return response()->json([
                'error' => 'Failed to calculate distance',
            ], 400);
        }

        $result = $this->feeCalculator->calculate($distance);

        return response()->json($result);
    }

    /**
     * Calculate delivery fee from Plus Code.
     */
    public function calculateDeliveryFeeFromPlusCode(Request $request): JsonResponse
    {
        $request->validate([
            'plus_code' => 'required|string',
        ]);

        $distance = $this->mapsService->calculateDistanceFromPlusCode(
            $request->input('plus_code'),
            $this->settings->store_latitude,
            $this->settings->store_longitude
        );

        if ($distance === null) {
            return response()->json([
                'error' => 'Failed to calculate distance from Plus Code',
            ], 400);
        }

        $result = $this->feeCalculator->calculate($distance);

        return response()->json($result);
    }
}
