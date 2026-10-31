<?php

use Illuminate\Foundation\Inspiring;
use App\Models\CycleProfile;
use Carbon\CarbonImmutable;
use App\Services\CrescentPushService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// One scheduler for every journey type. Each user (cycle, pregnancy, postpartum, co-cycling support)
// gets at most four scheduled notifications per local day, at the times defined in CrescentPushService::SCHEDULE.
Schedule::call(function () {
    $nowUtc = CarbonImmutable::now('UTC');
    $push = app(CrescentPushService::class);
    CycleProfile::query()
        ->whereHas('user.notificationPreference', fn ($q) => $q->where('push_enabled', true))
        ->with('user')
        ->chunkById(100, function ($profiles) use ($nowUtc, $push) {
            foreach ($profiles as $profile) {
                $push->dispatchScheduled($profile, $nowUtc);
            }
        });
})->name('crescent-scheduled-notifications')->everyMinute()->withoutOverlapping();
