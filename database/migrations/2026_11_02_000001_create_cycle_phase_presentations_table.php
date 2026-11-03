<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cycle_phase_presentations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('cycle_start_date');
            $table->string('phase', 24);
            $table->date('phase_start_date');
            $table->string('status', 24)->default('pending');
            $table->timestamp('presented_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['user_id', 'cycle_start_date', 'phase', 'phase_start_date'],
                'cycle_phase_presentation_unique'
            );
            $table->index(['user_id', 'status', 'phase_start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_phase_presentations');
    }
};
