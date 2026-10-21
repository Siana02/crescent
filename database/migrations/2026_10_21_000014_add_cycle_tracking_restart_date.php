<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cycle_profiles', 'cycle_tracking_started_at')) {
            Schema::table('cycle_profiles', function (Blueprint $table) {
                $table->date('cycle_tracking_started_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('cycle_profiles', 'cycle_tracking_started_at')) {
            Schema::table('cycle_profiles', function (Blueprint $table) {
                $table->dropColumn('cycle_tracking_started_at');
            });
        }
    }
};
