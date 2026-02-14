<?php

namespace App\Http\Controllers;

use App\Services\TelegramBotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramBotController extends Controller
{
    public function __construct(
        private TelegramBotService $botService
    ) {}

    /**
     * Handle incoming webhook from Telegram.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            $update = $request->all();

            // Verify webhook signature (optional but recommended)
            // You can implement additional verification here if needed

            // Handle message updates
            if (isset($update['message'])) {
                $message = $update['message'];
                $chatId = $message['chat']['id'];
                $text = $message['text'] ?? '';
                $from = $message['from'];

                // Handle commands
                if (str_starts_with($text, '/')) {
                    $this->handleCommand($text, $chatId, $from);
                }
            }

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            // Log the error but return 200 to prevent Telegram from retrying
            logger()->error('Telegram webhook error: '.$e->getMessage());

            return response()->json(['ok' => true]);
        }
    }

    /**
     * Handle bot commands.
     */
    private function handleCommand(string $text, int $chatId, array $from): void
    {
        $command = explode(' ', $text)[0];

        match ($command) {
            '/start' => $this->botService->handleStart($chatId, $from),
            '/shop' => $this->botService->handleShop($chatId),
            '/help' => $this->botService->handleHelp($chatId),
            default => null,
        };
    }
}
