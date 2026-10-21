<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cycle_profiles', function (Blueprint $table) {
            $table->date('birth_date')->nullable();
            $table->string('contraception_type', 32)->nullable();
            $table->string('primary_goal', 32)->default('track_cycle');
            $table->time('birth_time')->nullable();
            $table->string('birth_place', 160)->nullable();
            $table->string('sun_sign', 16)->nullable();
            $table->string('moon_sign', 16)->nullable();
            $table->string('rising_sign', 16)->nullable();
            $table->boolean('onboarding_completed')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('cycle_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'birth_date', 'contraception_type', 'primary_goal', 'birth_time',
                'birth_place', 'sun_sign', 'moon_sign', 'rising_sign', 'onboarding_completed',
            ]);
        });
    }
};
