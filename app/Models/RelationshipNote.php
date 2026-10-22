<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['relationship_id', 'author_id', 'note_date', 'body', 'read_at'])]
class RelationshipNote extends Model
{
    protected function casts(): array
    {
        return [
            'note_date' => 'date:Y-m-d',
            'read_at' => 'datetime',
        ];
    }

    public function relationship(): BelongsTo
    {
        return $this->belongsTo(Relationship::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
