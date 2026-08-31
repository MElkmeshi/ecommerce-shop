<?php

use App\Models\Product;

uses()->group('orders');

it('allows guests without telegram initData to view the orders page', function () {
    $response = $this->get('/orders');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('OrdersPage')
        ->has('orders', 0)
    );
});

it('rejects order creation without telegram initData', function () {
    $product = Product::factory()->create();

    $response = $this->postJson('/orders', [
        'phoneNumber' => '0912345678',
        'location' => ['latitude' => 32.8872, 'longitude' => 13.1913],
        'paymentMethod' => 'cash',
        'items' => [
            ['productId' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertUnauthorized()
        ->assertJson([
            'success' => false,
            'error' => 'Please verify your phone number or open this app from Telegram to place an order',
        ]);
});
