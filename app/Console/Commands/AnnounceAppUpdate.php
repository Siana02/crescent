<?php

namespace App\Console\Commands;

use App\Models\PushSubscription;
use App\Services\CrescentPushService;
use App\Support\AppVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class AnnounceAppUpdate extends Command
{
    protected $signature = 'crescent:announce-update {--force : Send even if this version was already announced}';
    protected $description = 'Send a one-time push notification to opted-in users when a new app version is deployed';

    public function handle(CrescentPushService $push): int
    {
        $version = AppVersion::current();
        $marker = storage_path('app/announced-version');
        $last = is_file($marker) ? trim((string) file_get_contents($marker)) : null;
        if (! $this->option('force') && $last === $version) {
            $this->info('This version was already announced.');
            return self::SUCCESS;
        }
        // First ever run only records the version so existing installs are not spammed.
        if ($last !== null || $this->option('force')) {
            PushSubscription::query()->distinct()->pluck('user_id')->each(function ($userId) use ($push) {
                $push->notify((int) $userId, 'app_update');
            });
        }
        file_put_contents($marker, $version);
        Cache::forget('crescent:app-version');
        $this->info('Announced version '.$version);
        return self::SUCCESS;
    }
}
