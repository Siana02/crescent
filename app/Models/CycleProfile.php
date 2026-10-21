<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'average_cycle_length', 'average_period_length', 'cycle_regularity', 'timezone'])]
class CycleProfile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'average_cycle_length' => 'integer',
            'average_period_length' => 'integer',
        ];
    }
}
