<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneOtp extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'phone_number',
        'code',
        'attempts',
        'expires_at',
        'consumed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'code' => 'encrypted',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }
}
