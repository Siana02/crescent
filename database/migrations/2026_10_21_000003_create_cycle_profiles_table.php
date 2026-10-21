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
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_profiles');
    }
};
