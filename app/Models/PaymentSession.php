<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentSession extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'provider_code',
        'provider_session_id',
        'amount',
        'provider_transaction_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Get the user that owns the payment session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order that owns the payment session.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the amount with commission added.
     */
    protected function amountWithCommission(): Attribute
    {
        return Attribute::make(
            get: function (): float {
                $settings = app(\App\Settings\AppSettings::class);
                $commissionPercent = $settings->credit_card_charge_percentage;

                return ((float) ($this->amount ?? 0)) * (1 + ($commissionPercent / 100));
            }
        );
    }

    /**
     * Check if payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if payment is completed.
     */
    public function isPayed(): bool
    {
        return $this->status === 'payed';
    }

    /**
     * Check if payment failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Mark payment as payed.
     */
    public function markAsPayed(string $transactionId): bool
    {
        return $this->update([
            'status' => 'payed',
            'provider_transaction_id' => $transactionId,
        ]);
    }

    /**
     * Mark payment as failed.
     */
    public function markAsFailed(): bool
    {
        return $this->update([
            'status' => 'failed',
        ]);
    }
}
