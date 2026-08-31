<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendPhoneOtpRequest;
use App\Http\Requests\VerifyPhoneOtpRequest;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PhoneAuthController extends Controller
{
    public function __construct(
        private readonly OtpService $otpService
    ) {}

    /**
     * Send a one-time verification code to the given phone number.
     */
    public function sendCode(SendPhoneOtpRequest $request): JsonResponse
    {
        $phoneNumber = $request->validated('phoneNumber');

        try {
            $this->otpService->send($phoneNumber);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 429);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Verify the one-time code and log the user in.
     */
    public function verify(VerifyPhoneOtpRequest $request): JsonResponse
    {
        $phoneNumber = $request->validated('phoneNumber');
        $code = $request->validated('code');

        if (! $this->otpService->verify($phoneNumber, $code)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired verification code.',
            ], 422);
        }

        $user = User::whereNull('telegram_id')
            ->where('phone_number', $phoneNumber)
            ->first();

        if (! $user) {
            $user = User::create([
                'name' => 'Guest',
                'phone_number' => $phoneNumber,
            ]);
        }

        Auth::login($user);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone_number' => $user->phone_number,
            ],
        ]);
    }
}
