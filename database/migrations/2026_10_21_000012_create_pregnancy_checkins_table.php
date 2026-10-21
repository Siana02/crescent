<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pregnancy_checkins')) {
            Schema::create('pregnancy_checkins', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pregnancy_id')->constrained()->cascadeOnDelete();
                $table->date('log_date');
                $table->json('symptoms')->nullable();
                $table->string('mood', 32)->nullable();
                $table->string('energy_level', 16)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->unique(['pregnancy_id', 'log_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pregnancy_checkins');
    }
};
