<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'due_date', 'last_period_date', 'conception_date',
    'due_date_source', 'wants_baby_astrology', 'status',
])]
class Pregnancy extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function postpartumLogs(): HasMany
    {
        return $this->hasMany(PostpartumLog::class);
    }

    public function checkins(): HasMany
    {
        return $this->hasMany(PregnancyCheckin::class);
    }

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'last_period_date' => 'date:Y-m-d',
            'conception_date' => 'date:Y-m-d',
            'wants_baby_astrology' => 'boolean',
        ];
    }
}
