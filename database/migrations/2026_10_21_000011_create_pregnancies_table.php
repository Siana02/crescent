<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pregnancies')) {
            Schema::create('pregnancies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->date('due_date');
                $table->date('last_period_date')->nullable();
                $table->date('conception_date')->nullable();
                $table->string('due_date_source', 24)->default('due_date');
                $table->boolean('wants_baby_astrology')->default(false);
                $table->string('status', 20)->default('active');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pregnancies');
    }
};
