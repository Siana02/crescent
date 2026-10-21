<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('postpartum_logs')) {
            Schema::create('postpartum_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pregnancy_id')->constrained()->cascadeOnDelete();
                $table->date('log_date');
                $table->string('category', 24);
                $table->text('notes');
                $table->timestamps();
                $table->index(['pregnancy_id', 'log_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('postpartum_logs');
    }
};
