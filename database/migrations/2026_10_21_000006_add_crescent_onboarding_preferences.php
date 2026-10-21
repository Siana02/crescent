<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cycle_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('cycle_profiles', 'display_name')) {
                $table->string('display_name', 100)->nullable();
            }
            if (!Schema::hasColumn('cycle_profiles', 'wants_astrology')) {
                $table->boolean('wants_astrology')->default(false);
            }
            if (!Schema::hasColumn('cycle_profiles', 'partner_preference')) {
                $table->string('partner_preference', 20)->default('solo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cycle_profiles', function (Blueprint $table) {
            foreach (['display_name', 'wants_astrology', 'partner_preference'] as $column) {
                if (Schema::hasColumn('cycle_profiles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
