<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cycle_profiles', function (Blueprint $table) {
            $table->string('relationship_role', 20)->default('tracker')->after('partner_preference');
        });
    }

    public function down(): void
    {
        Schema::table('cycle_profiles', function (Blueprint $table) {
            $table->dropColumn('relationship_role');
        });
    }
};
