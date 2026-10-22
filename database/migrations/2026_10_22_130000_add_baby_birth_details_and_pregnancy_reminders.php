<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pregnancies', function (Blueprint $table) {
            $table->string('baby_name')->nullable();
            $table->date('baby_birth_date')->nullable();
            $table->time('baby_birth_time')->nullable();
            $table->string('baby_birth_place')->nullable();
        });

        Schema::create('pregnancy_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pregnancy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title', 140);
            $table->string('category', 32)->default('appointment');
            $table->dateTime('remind_at');
            $table->text('notes')->nullable();
            $table->boolean('share_with_partner')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['pregnancy_id', 'remind_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pregnancy_reminders');
        Schema::table('pregnancies', function (Blueprint $table) {
            $table->dropColumn(['baby_name', 'baby_birth_date', 'baby_birth_time', 'baby_birth_place']);
        });
    }
};
