<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cycle_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('average_cycle_length')->nullable();
            $table->unsignedTinyInteger('average_period_length')->nullable();
            $table->string('cycle_regularity', 16)->default('unknown');
            $table->string('timezone', 64)->default('UTC');
            // Astrology is optional; none of these fields are required to track a cycle.
            $table->date('birth_date')->nullable();
            $table->string('contraception_type', 32)->nullable();
            $table->string('primary_goal', 32)->default('track_cycle');
            $table->time('birth_time')->nullable();
            $table->string('birth_place', 160)->nullable();
            $table->string('sun_sign', 16)->nullable();
            $table->string('moon_sign', 16)->nullable();
            $table->string('rising_sign', 16)->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_profiles');
    }
};
