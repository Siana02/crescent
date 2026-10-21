<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['relationship_id', 'insight_payload', 'calculation_version', 'calculated_at'])]
class CosmicCompatibility extends Model
{
    protected function casts(): array
    {
        return [
            'insight_payload' => 'array',
            'calculated_at' => 'datetime',
        ];
    }

    public function relationship(): BelongsTo
    {
        return $this->belongsTo(Relationship::class);
    }
}
