<?php

use App\Models\PhoneOtp;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\SmsService;

uses()->group('auth', 'phone-otp');

beforeEach(function () {
    $this->mock(SmsService::class, function ($mock) {
        $mock->shouldReceive('sendSms')->andReturn([
            'success' => true,
            'message_id' => 'fake-id',
            'error' => null,
        ]);
    });
});

it('sends an otp code to a phone number', function () {
    $response = $this->postJson('/auth/phone/otp', [
        'phoneNumber' => '0912345678',
    ]);

    $response->assertSuccessful()->assertJson(['success' => true]);

    expect(PhoneOtp::where('phone_number', '0912345678')->count())->toBe(1);
});

it('rejects an invalid phone number when requesting an otp', function () {
    $response = $this->postJson('/auth/phone/otp', [
        'phoneNumber' => 'not-a-phone',
    ]);

    $response->assertStatus(422);
});

it('throttles repeated otp requests for the same phone number', function () {
    $this->postJson('/auth/phone/otp', ['phoneNumber' => '0912345678'])->assertSuccessful();

    $response = $this->postJson('/auth/phone/otp', ['phoneNumber' => '0912345678']);

    $response->assertStatus(429)->assertJson(['success' => false]);
});

it('logs a user in with a valid otp code and rejects an invalid one', function () {
    $phoneNumber = '0912345678';

    PhoneOtp::create([
        'phone_number' => $phoneNumber,
        'code' => \Illuminate\Support\Facades\Hash::make('123456'),
        'expires_at' => now()->addMinutes(5),
    ]);

    $this->postJson('/auth/phone/verify', [
        'phoneNumber' => $phoneNumber,
        'code' => '000000',
    ])->assertStatus(422);

    $this->assertGuest();

    $response = $this->postJson('/auth/phone/verify', [
        'phoneNumber' => $phoneNumber,
        'code' => '123456',
    ]);

    $response->assertSuccessful()->assertJson(['success' => true]);

    $user = User::where('phone_number', $phoneNumber)->whereNull('telegram_id')->first();
    expect($user)->not->toBeNull();
    $this->assertAuthenticatedAs($user);
});

it('allows a phone-verified browser user to place an order and view it', function () {
    $phoneNumber = '0912345678';

    PhoneOtp::create([
        'phone_number' => $phoneNumber,
        'code' => \Illuminate\Support\Facades\Hash::make('123456'),
        'expires_at' => now()->addMinutes(5),
    ]);

    $this->postJson('/auth/phone/verify', [
        'phoneNumber' => $phoneNumber,
        'code' => '123456',
    ])->assertSuccessful();

    $product = Product::factory()->create();
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'price' => 10,
        'stock' => 5,
    ]);

    $orderResponse = $this->postJson('/orders', [
        'phoneNumber' => $phoneNumber,
        'location' => ['latitude' => 32.8872, 'longitude' => 13.1913],
        'paymentMethod' => 'cash',
        'items' => [
            ['productId' => $product->id, 'productVariantId' => $variant->id, 'quantity' => 1],
        ],
    ]);

    $orderResponse->assertCreated()->assertJson(['success' => true]);

    $ordersPage = $this->get('/orders');
    $ordersPage->assertSuccessful()->assertInertia(fn ($page) => $page
        ->component('OrdersPage')
        ->has('orders', 1)
    );
});
