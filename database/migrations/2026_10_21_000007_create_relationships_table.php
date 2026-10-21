<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_one_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_two_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('relationship_type', 20); // observer or co_tracker
            $table->string('status', 20)->default('pending'); // pending, accepted, revoked
            $table->string('invite_code', 12)->unique();
            $table->json('sharing_preferences')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->index(['user_one_id', 'status']);
            $table->index(['user_two_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relationships');
    }
};
