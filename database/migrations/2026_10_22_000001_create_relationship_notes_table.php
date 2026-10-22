<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relationship_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('relationship_id')->constrained('relationships')->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->date('note_date');
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->unique(['relationship_id', 'author_id', 'note_date']);
            $table->index(['relationship_id', 'note_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relationship_notes');
    }
};
