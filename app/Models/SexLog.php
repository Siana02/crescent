<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'log_date', 'activities', 'protection_methods', 'sex_drive', 'orgasm', 'notes'])]
class SexLog extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'log_date' => 'date:Y-m-d',
            'activities' => 'array',
            'protection_methods' => 'array',
            'sex_drive' => 'integer',
            'orgasm' => 'boolean',
        ];
    }
}
