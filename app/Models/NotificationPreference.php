<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'push_enabled', 'shared_notes', 'partner_updates', 'cycle_reminders', 'daily_checkin_reminders', 'private_previews'])]
class NotificationPreference extends Model
{
    protected function casts(): array
    {
        return [
            'push_enabled' => 'boolean',
            'shared_notes' => 'boolean',
            'partner_updates' => 'boolean',
            'cycle_reminders' => 'boolean',
            'daily_checkin_reminders' => 'boolean',
            'private_previews' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
