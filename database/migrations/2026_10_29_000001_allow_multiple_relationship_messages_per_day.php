<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('relationship_notes', function (Blueprint $table) {
            $table->dropUnique(['relationship_id', 'author_id', 'note_date']);
            $table->index(['relationship_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('relationship_notes', function (Blueprint $table) {
            $table->dropIndex(['relationship_id', 'created_at']);
            $table->unique(['relationship_id', 'author_id', 'note_date']);
        });
    }
};
