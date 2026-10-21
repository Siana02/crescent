<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('period_logs', 'flow_intensity')) {
            Schema::table('period_logs', function (Blueprint $table) {
                $table->string('flow_intensity', 20)->nullable()->after('end_date');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('period_logs', 'flow_intensity')) {
            Schema::table('period_logs', function (Blueprint $table) {
                $table->dropColumn('flow_intensity');
            });
        }
    }
};
