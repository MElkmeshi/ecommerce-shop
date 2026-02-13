<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Make email and password nullable for Telegram-only users
            $table->string('email')->nullable()->change();
            $table->string('password')->nullable()->change();

            // Make username nullable
            $table->string('username')->nullable()->change();

            // Add Telegram fields
            $table->bigInteger('telegram_id')->unique()->nullable()->after('id');
            $table->string('first_name')->nullable()->after('telegram_id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('language_code', 10)->nullable()->after('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'telegram_id',
                'first_name',
                'last_name',
                'language_code',
            ]);

            // Revert email and password to non-nullable
            $table->string('email')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->string('username')->nullable(false)->change();
        });
    }
};
