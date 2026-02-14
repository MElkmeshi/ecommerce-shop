<?php

namespace App\Console\Commands;

use App\Services\TelegramBotService;
use Illuminate\Console\Command;

class SetTelegramWebhook extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:set-webhook {url? : The webhook URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set the Telegram bot webhook URL';

    /**
     * Execute the console command.
     */
    public function handle(TelegramBotService $botService): int
    {
        $url = $this->argument('url') ?? config('services.webhook.url');

        if (! $url) {
            $this->error('No webhook URL provided. Please provide a URL or set WEBHOOK_URL in .env');

            return Command::FAILURE;
        }

        // Validate URL
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            $this->error('Invalid URL provided');

            return Command::FAILURE;
        }

        $this->info("Setting webhook to: {$url}");

        try {
            $botService->setWebhook($url);
            $this->info('✅ Webhook set successfully!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ Failed to set webhook: {$e->getMessage()}");

            return Command::FAILURE;
        }
    }
}
