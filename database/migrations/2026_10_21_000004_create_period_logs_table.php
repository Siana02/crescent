<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('period_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'start_date']);
            $table->index(['user_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('period_logs');
    }
};
