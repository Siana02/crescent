<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['pregnancy_id', 'created_by', 'title', 'category', 'remind_at', 'notes', 'share_with_partner', 'completed_at'])]
class PregnancyReminder extends Model
{
    public function pregnancy(): BelongsTo
    {
        return $this->belongsTo(Pregnancy::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function casts(): array
    {
        return ['remind_at' => 'datetime', 'completed_at' => 'datetime', 'share_with_partner' => 'boolean'];
    }
}
