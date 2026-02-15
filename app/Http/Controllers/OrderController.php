<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateOrderRequest;
use App\Jobs\CancelUnpaidOrder;
use App\Payments\PaymentManager;
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
        private readonly AppSettings $settings,
        private readonly PaymentManager $paymentManager
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

            $response = [
                'success' => true,
                'order' => [
                    'id' => $order->id,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'payment_method' => $order->payment_method,
                    'created_at' => $order->created_at,
                ],
            ];

            // If payment method is credit card, create payment session
            if ($orderData['paymentMethod'] === 'credit_card') {
                $session = $this->paymentManager->createSession(
                    providerCode: 'moamalat',
                    orderId: $order->id,
                    amount: $order->total_amount
                );

                $redirectUrl = $this->paymentManager->init($session);

                $response['payment'] = [
                    'session_id' => $session->id,
                    'redirect_url' => $redirectUrl,
                    'amount' => $session->amount,
                    'amount_with_commission' => $session->amount_with_commission,
                ];

                // Dispatch job to cancel unpaid order after 30 minutes
                CancelUnpaidOrder::dispatch($order)->delay(now()->addMinutes(30));
            }

            return response()->json($response, 201);
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
                // Calculate total from items if total_amount is 0 or null
                $itemsTotal = 0;
                foreach ($order->items as $item) {
                    $itemsTotal += $item->subtotal ?? 0;
                }
                $calculatedTotal = $itemsTotal + ($order->delivery_fee ?? 0);
                $totalAmount = ($order->total_amount ?? 0) > 0 ? $order->total_amount : $calculatedTotal;

                \Log::info('Order Total Calculation', [
                    'order_id' => $order->id,
                    'items_count' => $order->items->count(),
                    'items_total' => $itemsTotal,
                    'delivery_fee' => $order->delivery_fee,
                    'calculated_total' => $calculatedTotal,
                    'db_total_amount' => $order->total_amount,
                    'final_total' => $totalAmount,
                ]);

                return [
                    'id' => $order->id,
                    'total_amount' => (float) $totalAmount,
                    'delivery_fee' => (float) ($order->delivery_fee ?? 0),
                    'delivery_distance' => $order->delivery_distance,
                    'status' => $order->status,
                    'payment_method' => $order->payment_method ?? 'cash',
                    'payment_status' => $order->payment_status ?? 'N/A',
                    'phone_number' => $order->phone_number,
                    'location' => is_string($order->location) ? json_decode($order->location, true) : $order->location,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_name' => $item->product->name ?? 'Unknown Product',
                            'quantity' => (int) ($item->quantity ?? 0),
                            'price' => (float) ($item->price ?? 0),
                            'subtotal' => (float) ($item->subtotal ?? 0),
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

        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');

        // Round coordinates to 2 decimal places for cache key (approx 1 km precision)
        $latRounded = round($latitude, 2);
        $lonRounded = round($longitude, 2);
        $cacheKey = "delivery_fee:{$latRounded}:{$lonRounded}";

        // Cache for 7 days
        return response()->json(
            cache()->remember($cacheKey, now()->addDays(7), function () use ($latitude, $longitude) {
                $distance = $this->mapsService->calculateDistance(
                    $this->settings->store_latitude,
                    $this->settings->store_longitude,
                    $latitude,
                    $longitude
                );

                if ($distance === null) {
                    // Don't cache errors
                    cache()->forget('delivery_fee:'.round($latitude, 2).':'.round($longitude, 2));

                    return [
                        'error' => 'Failed to calculate distance',
                    ];
                }

                return $this->feeCalculator->calculate($distance);
            })
        );
    }

    /**
     * Calculate delivery fee from Plus Code.
     */
    public function calculateDeliveryFeeFromPlusCode(Request $request): JsonResponse
    {
        $request->validate([
            'plus_code' => 'required|string',
        ]);

        $plusCode = strtoupper(trim($request->input('plus_code')));
        $cacheKey = "delivery_fee:pluscode:{$plusCode}";

        // Cache for 7 days
        return response()->json(
            cache()->remember($cacheKey, now()->addDays(7), function () use ($plusCode) {
                $distance = $this->mapsService->calculateDistanceFromPlusCode(
                    $plusCode,
                    $this->settings->store_latitude,
                    $this->settings->store_longitude
                );

                if ($distance === null) {
                    // Don't cache errors
                    cache()->forget("delivery_fee:pluscode:{$plusCode}");

                    return [
                        'error' => 'Failed to calculate distance from Plus Code',
                    ];
                }

                return $this->feeCalculator->calculate($distance);
            })
        );
    }
}
