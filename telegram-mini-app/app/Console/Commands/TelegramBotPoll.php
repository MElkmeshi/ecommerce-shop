<?php

namespace App\Console\Commands;

use App\Services\TelegramBotService;
use Illuminate\Console\Command;
use TelegramBot\Api\BotApi;

class TelegramBotPoll extends Command
{
    protected $signature = 'telegram:poll';

    protected $description = 'Poll for Telegram bot updates (for local development)';

    public function handle(TelegramBotService $botService): int
    {
        $this->info('Starting Telegram bot polling...');
        $this->info('Press Ctrl+C to stop');

        $bot = new BotApi(config('services.telegram.bot_token'));
        $offset = 0;

        while (true) {
            try {
                $updates = $bot->getUpdates($offset, 100, 0);

                foreach ($updates as $update) {
                    $offset = $update->getUpdateId() + 1;

                    if ($message = $update->getMessage()) {
                        $chatId = $message->getChat()->getId();
                        $text = $message->getText() ?? '';
                        $from = [
                            'id' => $message->getFrom()->getId(),
                            'first_name' => $message->getFrom()->getFirstName(),
                            'last_name' => $message->getFrom()->getLastName(),
                            'username' => $message->getFrom()->getUsername(),
                            'language_code' => $message->getFrom()->getLanguageCode(),
                        ];

                        $this->info("Received: {$text} from {$from['first_name']}");

                        if (str_starts_with($text, '/start')) {
                            $botService->handleStart($chatId, $from);
                            $this->info('✅ Sent /start response');
                        } elseif (str_starts_with($text, '/shop')) {
                            $botService->handleShop($chatId);
                            $this->info('✅ Sent /shop response');
                        } elseif (str_starts_with($text, '/help')) {
                            $botService->handleHelp($chatId);
                            $this->info('✅ Sent /help response');
                        }
                    }
                }

                sleep(1);
            } catch (\Exception $e) {
                $this->error("Error: {$e->getMessage()}");
                sleep(5);
            }
        }

        return self::SUCCESS;
    }
}
