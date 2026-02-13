<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::create([
            'username' => 'admin',
            'password' => 'admin123', // Will be automatically hashed by the model
        ]);

        $this->command->info('✅ Admin user created: username=admin, password=admin123');
    }
}
