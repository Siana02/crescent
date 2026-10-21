<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'average_cycle_length', 'average_period_length', 'cycle_regularity', 'timezone',
    'birth_date', 'contraception_type', 'primary_goal', 'birth_time', 'birth_place',
    'sun_sign', 'moon_sign', 'rising_sign', 'onboarding_completed',
])]
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
            'birth_date' => 'date:Y-m-d',
            'onboarding_completed' => 'boolean',
        ];
    }
}
