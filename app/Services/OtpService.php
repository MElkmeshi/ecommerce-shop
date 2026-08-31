<?php

namespace App\Services;

use App\Models\PhoneOtp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class OtpService
{
    private const CODE_TTL_MINUTES = 5;

    private const MAX_VERIFY_ATTEMPTS = 5;

    private const RESEND_THROTTLE_SECONDS = 60;

    private const HOURLY_LIMIT = 5;

    public function __construct(
        private readonly SmsService $smsService
    ) {}

    /**
     * Generate and send a one-time code to the given phone number.
     *
     * @throws \RuntimeException when the phone number is being throttled
     */
    public function send(string $phoneNumber): void
    {
        $resendKey = "otp-resend:{$phoneNumber}";
        $hourlyKey = "otp-hourly:{$phoneNumber}";

        if (RateLimiter::tooManyAttempts($resendKey, 1) || RateLimiter::tooManyAttempts($hourlyKey, self::HOURLY_LIMIT)) {
            throw new \RuntimeException('Please wait before requesting another code.');
        }

        $code = (string) random_int(100000, 999999);

        PhoneOtp::create([
            'phone_number' => $phoneNumber,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
        ]);

        RateLimiter::hit($resendKey, self::RESEND_THROTTLE_SECONDS);
        RateLimiter::hit($hourlyKey, 3600);

        $this->smsService->sendSms($phoneNumber, "Your verification code is {$code}. It expires in ".self::CODE_TTL_MINUTES.' minutes.');
    }

    /**
     * Verify a one-time code for the given phone number.
     */
    public function verify(string $phoneNumber, string $code): bool
    {
        $otp = PhoneOtp::where('phone_number', $phoneNumber)
            ->whereNull('consumed_at')
            ->where('expires_at', '>=', now())
            ->orderByDesc('id')
            ->first();

        if (! $otp) {
            return false;
        }

        if ($otp->attempts >= self::MAX_VERIFY_ATTEMPTS) {
            return false;
        }

        if (! Hash::check($code, $otp->code)) {
            $otp->increment('attempts');

            return false;
        }

        $otp->update(['consumed_at' => now()]);

        return true;
    }
}
