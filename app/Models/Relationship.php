<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_one_id', 'user_two_id', 'relationship_type', 'status', 'invite_code',
    'sharing_preferences', 'accepted_at', 'expires_at',
])]
class Relationship extends Model
{
    protected function casts(): array
    {
        return [
            'sharing_preferences' => 'array',
            'accepted_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function companion(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function compatibility(): HasOne
    {
        return $this->hasOne(CosmicCompatibility::class);
    }
}
