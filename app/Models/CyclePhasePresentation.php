<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'cycle_start_date', 'phase', 'phase_start_date',
    'status', 'presented_at', 'responded_at',
])]
class CyclePhasePresentation extends Model
{
    protected function casts(): array
    {
        return [
            'cycle_start_date' => 'date:Y-m-d',
            'phase_start_date' => 'date:Y-m-d',
            'presented_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
