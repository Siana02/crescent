<?php

use Illuminate\Foundation\Inspiring;
use App\Models\CycleProfile;
use App\Models\NotificationPreference;
use App\Services\CrescentPushService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// Send opt-in check-in nudges at 6pm in each user's saved local timezone.
// The cache key prevents duplicate delivery if the scheduler runs more than once in a minute.
Schedule::call(function () {
    $nowUtc = now('UTC');
    NotificationPreference::query()
        ->where('push_enabled', true)
        ->where('daily_checkin_reminders', true)
        ->with('user.cycleProfile')
        ->chunkById(100, function ($preferences) use ($nowUtc) {
            $push = app(CrescentPushService::class);
            foreach ($preferences as $preference) {
                $user = $preference->user;
                if (! $user) {
                    continue;
                }
                $timezone = $user->cycleProfile?->timezone ?: config('app.timezone', 'UTC');
                if ($nowUtc->copy()->setTimezone($timezone)->format('H:i') !== '18:00') {
                    continue;
                }
                $localDate = $nowUtc->copy()->setTimezone($timezone)->toDateString();
                $key = 'crescent:daily-checkin-reminder:'.$user->id.':'.$localDate;
                if (Cache::add($key, true, now()->addDays(2))) {
                    $push->notify((int) $user->id, 'daily_checkin');
                }
            }
        });
})->name('crescent-daily-checkin-reminders')->everyMinute()->withoutOverlapping();

// Morning (9am local) cycle notifications: tracker cycle-day reminders, plus phase changes
// and the tip of the day for connected support partners. Cache keys prevent duplicates.
Schedule::call(function () {
    $nowUtc = now('UTC');
    $push = app(CrescentPushService::class);
    CycleProfile::query()
        ->where(fn ($q) => $q->whereNull('relationship_role')->orWhere('relationship_role', '!=', 'support'))
        ->with('user')
        ->chunkById(100, function ($profiles) use ($nowUtc, $push) {
            foreach ($profiles as $profile) {
                $user = $profile->user;
                $timezone = $profile->timezone ?: 'UTC';
                if (! $user || $nowUtc->copy()->setTimezone($timezone)->format('H:i') !== '09:00') {
                    continue;
                }
                $snapshot = $push->cycleSnapshot($user);
                if ($snapshot['day'] === null) {
                    continue;
                }
                $localDate = $nowUtc->copy()->setTimezone($timezone)->toDateString();
                if (Cache::add('crescent:cycle-day:'.$user->id.':'.$localDate, true, now()->addDays(2))) {
                    $push->notify((int) $user->id, 'cycle_day');
                }
                $phaseKey = 'crescent:phase:'.$user->id.':'.$snapshot['period_start'].':'.$snapshot['phase'];
                if (Cache::add($phaseKey, true, now()->addDays(60))) {
                    $push->notifyPartners($user, 'partner_'.$snapshot['phase'], 'cycle_details', 'crescent:phase-partner:'.$user->id.':'.$snapshot['period_start'].':'.$snapshot['phase'], 60 * 24 * 60);
                }
                $push->notifyPartners($user, 'partner_tip', 'cycle_details', 'crescent:partner-tip:'.$user->id.':'.$localDate, 2 * 24 * 60);
            }
        });
})->name('crescent-morning-cycle-notifications')->everyMinute()->withoutOverlapping();
