<?php

namespace App\Services;

use App\Models\User;
use TelegramBot\Api\BotApi;
use TelegramBot\Api\Types\Inline\InlineKeyboardMarkup;

class TelegramBotService
{
    protected BotApi $bot;

    protected string $webAppUrl;

    public function __construct()
    {
        $botToken = config('services.telegram.bot_token');
        $this->bot = new BotApi($botToken);
        $this->webAppUrl = config('app.url');
    }

    /**
     * Handle /start command.
     */
    public function handleStart(int $chatId, array $user): void
    {
        // Create or update user in database
        $firstName = $user['first_name'] ?? '';
        $lastName = $user['last_name'] ?? '';
        $username = $user['username'] ?? '';

        User::updateOrCreate(
            ['telegram_id' => $user['id']],
            [
                'first_name' => $user['first_name'] ?? null,
                'last_name' => $user['last_name'] ?? null,
                'username' => $user['username'] ?? null,
                'language_code' => $user['language_code'] ?? 'en',
                'name' => trim($firstName.' '.$lastName) ?: $username ?: 'Telegram User',
            ]
        );

        $firstName = $user['first_name'] ?? 'there';
        $message = "👋 Welcome to our E-Commerce Shop, {$firstName}!\n\n";
        $message .= "Browse our products, add items to your cart, and place orders directly through Telegram.\n\n";
        $message .= 'Click the button below to open the shop!';

        $keyboard = new InlineKeyboardMarkup([
            [
                [
                    'text' => '🛍️ Open Shop',
                    'web_app' => ['url' => $this->webAppUrl],
                ],
            ],
        ]);

        $this->bot->sendMessage($chatId, $message, null, false, null, $keyboard);
    }

    /**
     * Handle /shop command.
     */
    public function handleShop(int $chatId): void
    {
        $message = '🛍️ Click the button below to open our shop:';

        $keyboard = new InlineKeyboardMarkup([
            [
                [
                    'text' => '🛍️ Open Shop',
                    'web_app' => ['url' => $this->webAppUrl],
                ],
            ],
        ]);

        $this->bot->sendMessage($chatId, $message, null, false, null, $keyboard);
    }

    /**
     * Handle /help command.
     */
    public function handleHelp(int $chatId): void
    {
        $message = "📖 *How to use this bot:*\n\n";
        $message .= "• `/start` - Welcome message and open shop\n";
        $message .= "• `/shop` - Open the shop\n";
        $message .= "• `/help` - Show this help message\n\n";
        $message .= "Simply click the 'Open Shop' button to browse products, add items to cart, and place orders!";

        $this->bot->sendMessage($chatId, $message, 'Markdown');
    }

    /**
     * Set webhook URL.
     */
    public function setWebhook(string $url): bool
    {
        try {
            $this->bot->setWebhook($url);

            return true;
        } catch (\Exception $e) {
            throw new \Exception("Failed to set webhook: {$e->getMessage()}");
        }
    }

    /**
     * Send a message to a chat.
     */
    public function sendMessage(int $chatId, string $text, array $options = []): void
    {
        $parseMode = $options['parse_mode'] ?? null;
        $keyboard = $options['keyboard'] ?? null;

        $this->bot->sendMessage($chatId, $text, $parseMode, false, null, $keyboard);
    }
}
