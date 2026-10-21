<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cycle_profiles', 'partner_preference')) {
            Schema::table('cycle_profiles', function (Blueprint $table) {
                $table->string('partner_preference', 20)->default('solo');
            });
        }
    }

    public function down(): void
    {
        // Keep this preference on rollback; deleting a user's saved choice is unnecessary.
    }
};
