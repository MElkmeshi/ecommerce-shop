<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'telegram_id',
        'first_name',
        'last_name',
        'username',
        'language_code',
        'phone_number',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'telegram_id' => 'integer',
        ];
    }

    /**
     * Get the user's orders.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Check if the user is a Telegram user.
     */
    public function isTelegramUser(): bool
    {
        return ! is_null($this->telegram_id);
    }

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute(): string
    {
        if ($this->first_name && $this->last_name) {
            return "{$this->first_name} {$this->last_name}";
        }

        return $this->first_name ?? $this->username ?? $this->name ?? 'User';
    }

    /**
     * Get the user's preferred locale.
     */
    public function getPreferredLocale(): string
    {
        if ($this->language_code) {
            // Map Telegram language codes to app locales
            $locale = substr($this->language_code, 0, 2);

            return in_array($locale, ['ar', 'en']) ? $locale : 'en';
        }

        return config('app.locale', 'en');
    }

    /**
     * Scope a query to only include Telegram users.
     */
    public function scopeTelegramUsers($query)
    {
        return $query->whereNotNull('telegram_id');
    }

    /**
     * Scope a query to only include regular users.
     */
    public function scopeRegularUsers($query)
    {
        return $query->whereNull('telegram_id');
    }
}
