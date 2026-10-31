<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('pregnancy_checkins', 'details')) {
            Schema::table('pregnancy_checkins', function (Blueprint $table) {
                // Per-symptom severity/duration/frequency and sleep quality; existing rows stay valid with null.
                $table->json('details')->nullable()->after('notes');
            });
        }
    }

    public function down(): void
    {
        Schema::table('pregnancy_checkins', function (Blueprint $table) {
            $table->dropColumn('details');
        });
    }
};
