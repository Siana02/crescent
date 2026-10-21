<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cosmic_compatibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('relationship_id')->unique()->constrained('relationships')->cascadeOnDelete();
            $table->json('insight_payload')->nullable();
            $table->string('calculation_version', 32)->default('v1');
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cosmic_compatibilities');
    }
};
