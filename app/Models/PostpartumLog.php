<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['pregnancy_id', 'log_date', 'category', 'notes'])]
class PostpartumLog extends Model
{
    public function pregnancy(): BelongsTo
    {
        return $this->belongsTo(Pregnancy::class);
    }

    protected function casts(): array
    {
        return ['log_date' => 'date:Y-m-d'];
    }
}
