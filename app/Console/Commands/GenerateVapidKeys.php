<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    protected $signature = 'crescent:vapid-keys';
    protected $description = 'Generate VAPID keys for Crescent push notifications';

    public function handle(): int
    {
        $keys = VAPID::createVapidKeys();
        $this->line('Add these to your hosting environment (never commit the private key):');
        $this->line('VAPID_PUBLIC_KEY='.$keys['publicKey']);
        $this->line('VAPID_PRIVATE_KEY='.$keys['privateKey']);
        $this->line('VAPID_SUBJECT=mailto:you@example.com');
        return self::SUCCESS;
    }
}
