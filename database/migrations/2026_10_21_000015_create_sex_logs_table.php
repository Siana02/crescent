<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sex_logs')) {
            Schema::create('sex_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->date('log_date');
                $table->json('activities')->nullable();
                $table->json('protection_methods')->nullable();
                $table->unsignedTinyInteger('sex_drive')->nullable();
                $table->boolean('orgasm')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['user_id', 'log_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sex_logs');
    }
};
