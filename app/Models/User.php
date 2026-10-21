<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function cycleProfile(): HasOne
    {
        return $this->hasOne(CycleProfile::class);
    }

    public function pregnancies(): HasMany
    {
        return $this->hasMany(Pregnancy::class);
    }

    public function periodLogs(): HasMany
    {
        return $this->hasMany(PeriodLog::class);
    }

    public function dailyCheckins(): HasMany
    {
        return $this->hasMany(DailyCheckin::class);
    }

    public function sexLogs(): HasMany
    {
        return $this->hasMany(SexLog::class);
    }

    public function initiatedRelationships(): HasMany
    {
        return $this->hasMany(Relationship::class, 'user_one_id');
    }

    public function companionRelationships(): HasMany
    {
        return $this->hasMany(Relationship::class, 'user_two_id');
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
