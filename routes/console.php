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
