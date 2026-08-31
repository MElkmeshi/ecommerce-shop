<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * iSend SMS API endpoint.
     */
    private string $apiEndpoint;

    /**
     * API token from configuration.
     */
    private string $apiToken;

    /**
     * Sender ID.
     */
    private string $senderId;

    public function __construct()
    {
        $apiEndpoint = config('services.isend.base_url');
        $apiToken = config('services.isend.api_token');
        $senderId = config('services.isend.sender_id');

        $this->apiEndpoint = is_string($apiEndpoint) ? $apiEndpoint : 'https://isend.com.ly/api/v3/sms/send';
        $this->apiToken = is_string($apiToken) ? $apiToken : '';
        $this->senderId = is_string($senderId) ? $senderId : 'iSend';

        if (! $this->apiToken) {
            throw new Exception('iSend SMS API token is not configured');
        }
    }

    /**
     * Send SMS to recipient.
     *
     * @param  string  $recipient  Phone number with country code
     * @param  string  $message  SMS message content
     * @return array{success: bool, message_id: string|null, error: string|null}
     */
    public function sendSms(string $recipient, string $message): array
    {
        try {
            $response = Http::withToken($this->apiToken)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($this->apiEndpoint, [
                    'recipient' => $recipient,
                    'sender_id' => $this->senderId,
                    'type' => 'plain',
                    'message' => $message,
                ]);

            if ($response->successful()) {
                $data = $response->json();

                if (is_array($data) && isset($data['status']) && $data['status'] === 'success') {
                    Log::info('SMS sent successfully', [
                        'recipient' => $recipient,
                        'response' => $data,
                    ]);

                    $messageId = null;
                    if (is_array($data['data'] ?? null) && isset($data['data']['id'])) {
                        $id = $data['data']['id'];
                        $messageId = is_scalar($id) ? (string) $id : null;
                    }

                    return [
                        'success' => true,
                        'message_id' => $messageId,
                        'error' => null,
                    ];
                }
            }

            $errorResponse = $response->json('message');
            $errorMessage = is_string($errorResponse) ? $errorResponse : 'Unknown error';
            Log::error('SMS sending failed', [
                'recipient' => $recipient,
                'error' => $errorMessage,
                'status_code' => $response->status(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $errorMessage,
            ];
        } catch (Exception $e) {
            Log::error('SMS service exception', [
                'recipient' => $recipient,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
