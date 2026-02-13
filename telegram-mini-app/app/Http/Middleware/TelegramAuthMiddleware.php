<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TelegramAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get initData from header
        $initData = $request->header('x-telegram-init-data');

        if (! $initData) {
            return response()->json(['error' => 'Unauthorized: Missing Telegram initData'], 401);
        }

        $botToken = config('services.telegram.bot_token');

        if (! $botToken) {
            return response()->json(['error' => 'Server configuration error'], 500);
        }

        // Verify the initData signature
        if (! $this->verifyTelegramInitData($initData, $botToken)) {
            return response()->json(['error' => 'Unauthorized: Invalid Telegram signature'], 401);
        }

        // Parse user data from initData
        $telegramUser = $this->parseTelegramUser($initData);

        if (! $telegramUser) {
            return response()->json(['error' => 'Unauthorized: Invalid user data'], 401);
        }

        // Find or create user in database
        $user = User::updateOrCreate(
            ['telegram_id' => $telegramUser['id']],
            [
                'first_name' => $telegramUser['first_name'] ?? null,
                'last_name' => $telegramUser['last_name'] ?? null,
                'username' => $telegramUser['username'] ?? null,
                'language_code' => $telegramUser['language_code'] ?? 'en',
            ]
        );

        // Set app locale based on user's language
        $locale = $user->getPreferredLocale();
        App::setLocale($locale);

        // Authenticate the user
        Auth::login($user);

        // Attach user to request
        $request->merge(['telegram_user' => $telegramUser]);

        return $next($request);
    }

    /**
     * Verify Telegram initData using HMAC-SHA256.
     *
     * @param  string  $initData  The initData string from Telegram
     * @param  string  $botToken  The bot token
     */
    private function verifyTelegramInitData(string $initData, string $botToken): bool
    {
        // Parse the initData query string
        parse_str($initData, $params);

        // Extract the hash
        $hash = $params['hash'] ?? null;
        unset($params['hash']);

        if (! $hash) {
            return false;
        }

        // Create data check string (sorted key=value pairs)
        ksort($params);
        $dataCheckString = implode("\n", array_map(
            fn ($key, $value) => "{$key}={$value}",
            array_keys($params),
            $params
        ));

        // Calculate secret key
        $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);

        // Calculate expected hash
        $expectedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

        // Compare hashes
        return hash_equals($expectedHash, $hash);
    }

    /**
     * Parse Telegram user data from initData.
     *
     * @param  string  $initData  The initData string
     * @return array|null User data or null if invalid
     */
    private function parseTelegramUser(string $initData): ?array
    {
        parse_str($initData, $params);

        if (! isset($params['user'])) {
            return null;
        }

        $userData = json_decode($params['user'], true);

        if (! $userData || ! isset($userData['id'])) {
            return null;
        }

        return $userData;
    }
}
