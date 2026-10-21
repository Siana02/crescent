<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'log_date', 'energy_level', 'mood', 'symptoms', 'notes'])]
class DailyCheckin extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'log_date' => 'date:Y-m-d',
            'symptoms' => 'array',
        ];
    }
}
