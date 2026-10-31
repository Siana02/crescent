<?php

namespace App\Services;

use App\Models\CycleProfile;
use App\Models\NotificationPreference;
use App\Models\PushSubscription;
use App\Models\Relationship;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class CrescentPushService
{
    /** Human-readable reason the last notify() call did not deliver. */
    public ?string $lastError = null;

    /**
     * Allow-listed events. Wording is intentionally neutral: lock-screen text never includes
     * names, dates, symptoms, fertility details or note contents.
     */
    public const EVENTS = [
        'shared_note' => ['pref' => 'shared_notes', 'title' => 'A note from your partner', 'body' => 'A new note is waiting for you in Crescent.', 'url' => '/dashboard#shared-partner-space'],
        'note_read' => ['pref' => 'shared_notes', 'title' => 'Your note was read', 'body' => 'Your partner has read your latest note.', 'url' => '/dashboard#shared-partner-space'],
        'partner_symptoms' => ['pref' => 'partner_updates', 'title' => 'A new check-in was shared', 'body' => 'Your partner shared a wellbeing check-in. Open Crescent to see how you can show up.', 'url' => '/dashboard'],
        'partner_menstruating' => ['pref' => 'partner_updates', 'title' => 'A cycle update', 'body' => 'A new cycle phase update is ready for you in Crescent.', 'url' => '/dashboard'],
        'partner_follicular' => ['pref' => 'partner_updates', 'title' => 'A cycle update', 'body' => 'A new cycle phase update is ready for you in Crescent.', 'url' => '/dashboard'],
        'partner_ovulatory' => ['pref' => 'partner_updates', 'title' => 'A cycle update', 'body' => 'A new cycle phase update is ready for you in Crescent.', 'url' => '/dashboard'],
        'partner_luteal' => ['pref' => 'partner_updates', 'title' => 'A cycle update', 'body' => 'A new cycle phase update is ready for you in Crescent.', 'url' => '/dashboard'],
        'partner_tip' => ['pref' => 'partner_updates', 'title' => 'Today’s tip is ready', 'body' => 'Take a moment to read today’s gentle care tip in Crescent.', 'url' => '/dashboard#care-guide'],
        'cycle_day' => ['pref' => 'cycle_reminders', 'title' => 'Your cycle today', 'body' => 'Your estimated cycle day is ready in Crescent.', 'url' => '/dashboard'],
        'daily_checkin' => ['pref' => 'daily_checkin_reminders', 'title' => 'A moment for yourself', 'body' => 'Would you like to log how you feel today?', 'url' => '/dashboard'],
        'checkin_reminder' => ['pref' => 'daily_checkin_reminders', 'title' => 'A gentle nudge', 'body' => 'Your partner would love to hear how you feel. Would you like to log today\'s check-in?', 'url' => '/dashboard'],
        'cycle_selfcare' => ['pref' => 'cycle_reminders', 'title' => 'A small act of care', 'body' => 'A gentle self-care idea for today is waiting in Crescent.', 'url' => '/dashboard'],
        'cycle_winddown' => ['pref' => 'cycle_reminders', 'title' => 'Winding down', 'body' => 'Take a quiet moment tonight to reflect in Crescent.', 'url' => '/dashboard'],
        'pregnancy_week' => ['pref' => 'cycle_reminders', 'title' => 'Your pregnancy today', 'body' => 'Your week-by-week update is ready in Crescent.', 'url' => '/dashboard'],
        'pregnancy_tip' => ['pref' => 'cycle_reminders', 'title' => 'A little tip for today', 'body' => 'A gentle pregnancy tip is waiting for you in Crescent.', 'url' => '/dashboard#pregnancy-week-guide'],
        'pregnancy_checkin' => ['pref' => 'daily_checkin_reminders', 'title' => 'A moment for you and baby', 'body' => 'Would you like to log how you feel today?', 'url' => '/dashboard#pregnancy-checkin'],
        'pregnancy_winddown' => ['pref' => 'cycle_reminders', 'title' => 'Rest well tonight', 'body' => 'A calm end-of-day moment is ready in Crescent.', 'url' => '/dashboard'],
        'postpartum_morning' => ['pref' => 'cycle_reminders', 'title' => 'Good morning, gentle reminder', 'body' => 'Your postpartum space is ready in Crescent.', 'url' => '/dashboard'],
        'postpartum_selfcare' => ['pref' => 'cycle_reminders', 'title' => 'Care for you too', 'body' => 'Take a moment for water, food and rest. A tip is waiting in Crescent.', 'url' => '/dashboard'],
        'postpartum_checkin' => ['pref' => 'daily_checkin_reminders', 'title' => 'How are you today?', 'body' => 'Would you like to log how you are feeling?', 'url' => '/dashboard'],
        'support_connect' => ['pref' => 'partner_updates', 'title' => 'Stay connected', 'body' => 'A kind word goes a long way. Leave a note in your shared space.', 'url' => '/dashboard#shared-partner-space'],
        'app_update' => ['pref' => null, 'title' => 'A Crescent update is ready ✨', 'body' => 'Open Crescent to get the latest version. No reinstall needed.', 'url' => '/dashboard'],
        'test' => ['pref' => null, 'title' => 'Crescent notifications are on ☾', 'body' => 'This is a test. Your device is ready for gentle updates.', 'url' => '/profile'],
    ];

    public static function configured(): bool
    {
        return (bool) config('services.webpush.public_key') && (bool) config('services.webpush.private_key');
    }

    /** Hard ceiling on scheduled notifications per user per local day. */
    public const DAILY_SCHEDULED_LIMIT = 4;

    /** journey type => list of [local HH:MM, event]. Each list holds at most DAILY_SCHEDULED_LIMIT slots. */
    public const SCHEDULE = [
        'cycle' => [['09:00', 'cycle_day'], ['12:30', 'cycle_selfcare'], ['18:00', 'daily_checkin'], ['21:00', 'cycle_winddown']],
        'pregnancy' => [['09:00', 'pregnancy_week'], ['13:00', 'pregnancy_tip'], ['18:00', 'pregnancy_checkin'], ['21:00', 'pregnancy_winddown']],
        'postpartum' => [['09:00', 'postpartum_morning'], ['14:00', 'postpartum_selfcare'], ['19:00', 'postpartum_checkin']],
        'support' => [['09:00', 'partner_phase'], ['12:00', 'partner_tip'], ['18:00', 'support_connect']],
    ];

    /** A slot may fire late (scheduler hiccup) for up to this many minutes. */
    public const SLOT_WINDOW_MINUTES = 15;

    public function userType(CycleProfile $profile): string
    {
        if ($profile->relationship_role === 'support') {
            return 'support';
        }
        return match ($profile->active_journey) {
            'pregnancy' => 'pregnancy',
            'postpartum' => 'postpartum',
            default => 'cycle',
        };
    }

    /** Sends every scheduled notification that is due for the user's type, at most four per local day. */
    public function dispatchScheduled(CycleProfile $profile, CarbonImmutable $nowUtc): int
    {
        $user = $profile->user;
        if (! $user) {
            return 0;
        }
        $local = $nowUtc->setTimezone($profile->timezone ?: 'UTC');
        $date = $local->toDateString();
        $sent = 0;
        foreach (self::SCHEDULE[$this->userType($profile)] as [$time, $event]) {
            $slot = $local->setTimeFromTimeString($time);
            $late = $slot->diffInMinutes($local, false);
            if ($late < 0 || $late >= self::SLOT_WINDOW_MINUTES) {
                continue;
            }
            $countKey = 'crescent:scheduled-count:'.$user->id.':'.$date;
            if ((int) Cache::get($countKey, 0) >= self::DAILY_SCHEDULED_LIMIT) {
                break;
            }
            if (! Cache::add('crescent:scheduled:'.$user->id.':'.$date.':'.$event, true, now()->addDays(2))) {
                continue;
            }
            $event = $this->resolveEvent($user, $profile, $event, $date);
            if ($event && $this->notify((int) $user->id, $event)) {
                Cache::add($countKey, 0, now()->addDays(2));
                Cache::increment($countKey);
                $sent++;
            }
        }
        return $sent;
    }

    /** Returns the event to send, or null when there is nothing useful to say right now. */
    private function resolveEvent(User $user, CycleProfile $profile, string $event, string $date): ?string
    {
        switch ($event) {
            case 'cycle_day':
            case 'cycle_selfcare':
            case 'cycle_winddown':
                return $this->cycleSnapshot($user)['day'] === null ? null : $event;
            case 'daily_checkin':
                return $user->dailyCheckins()->whereDate('log_date', $date)->exists() ? null : $event;
            case 'pregnancy_week':
            case 'pregnancy_tip':
            case 'pregnancy_winddown':
                return $user->pregnancies()->where('status', 'active')->exists() ? $event : null;
            case 'pregnancy_checkin':
                $pregnancy = $user->pregnancies()->where('status', 'active')->latest()->first();
                return $pregnancy && ! $pregnancy->checkins()->whereDate('log_date', $date)->exists() ? $event : null;
            case 'postpartum_morning':
            case 'postpartum_selfcare':
            case 'postpartum_checkin':
                return $user->pregnancies()->where('status', 'postpartum')->exists() ? $event : null;
            case 'partner_phase':
                foreach ($this->connectedPrimaries($user, 'cycle_details') as $primary) {
                    $snapshot = $this->cycleSnapshot($primary);
                    if ($snapshot['day'] !== null) {
                        return 'partner_'.$snapshot['phase'];
                    }
                }
                return null;
            case 'partner_tip':
                return $this->connectedPrimaries($user, 'cycle_details') ? $event : null;
            case 'support_connect':
                return $this->connectedPrimaries($user, 'wellbeing_updates') || $this->connectedPrimaries($user, 'cycle_details') ? $event : null;
        }
        return $event;
    }

    /** @return User[] connected primary users who share the given category with $viewer. */
    public function connectedPrimaries(User $viewer, string $permission): array
    {
        $primaries = [];
        $relationships = Relationship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('user_one_id', $viewer->id)->orWhere('user_two_id', $viewer->id))
            ->get();
        foreach ($relationships as $relationship) {
            $otherId = (int) ($relationship->user_one_id === $viewer->id ? $relationship->user_two_id : $relationship->user_one_id);
            if (! $otherId) {
                continue;
            }
            $all = $relationship->sharing_preferences ?? [];
            $theirs = $all[(string) $otherId] ?? $all;
            if (! empty($theirs[$permission]) && ($other = User::with('cycleProfile')->find($otherId))) {
                $primaries[] = $other;
            }
        }
        return $primaries;
    }

    /** Returns true when at least one device accepted the message. */
    public function notify(int $userId, string $event): bool
    {
        $this->lastError = null;
        $definition = self::EVENTS[$event] ?? null;
        $preferences = NotificationPreference::where('user_id', $userId)->first();
        if (! $definition || ! $preferences || ! $preferences->push_enabled) {
            $this->lastError = 'Push notifications are not turned on for your account yet. Tap "Enable push notifications" first.';
            return false;
        }
        if ($definition['pref'] && ! $preferences->{$definition['pref']}) {
            return false;
        }
        if (! class_exists(WebPush::class)) {
            Log::warning('Crescent push package is not installed; notification not sent.');
            $this->lastError = 'The server is missing the web-push package. Run "composer install" on the server.';
            return false;
        }
        if (! self::configured()) {
            Log::warning('Crescent Web Push is not configured (VAPID keys missing); notification not sent.');
            $this->lastError = 'The server has no VAPID keys. Set APP_KEY (or VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY).';
            return false;
        }

        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) {
            $this->lastError = 'No device is subscribed. Tap "Enable push notifications" on this device.';
            return false;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('services.webpush.subject') ?: 'mailto:admin@example.com',
                    'publicKey' => config('services.webpush.public_key'),
                    'privateKey' => config('services.webpush.private_key'),
                ],
            ]);
            $payload = json_encode([
                'title' => $definition['title'],
                'body' => $definition['body'],
                'url' => $definition['url'],
                'tag' => 'crescent-'.$event,
            ], JSON_THROW_ON_ERROR);
            foreach ($subscriptions as $stored) {
                $webPush->queueNotification(Subscription::create([
                    'endpoint' => $stored->endpoint,
                    'publicKey' => $stored->public_key,
                    'authToken' => $stored->auth_token,
                    'contentEncoding' => $stored->content_encoding,
                ]), $payload);
            }

            $delivered = false;
            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    $delivered = true;
                    continue;
                }
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint_hash', hash('sha256', $report->getEndpoint()))->delete();
                }
                $this->lastError = 'The push service rejected the message: '.$report->getReason();
                Log::warning('Crescent push delivery failed.', ['reason' => $report->getReason()]);
            }
            return $delivered;
        } catch (\Throwable $exception) {
            report($exception);
            $this->lastError = 'Push delivery error: '.$exception->getMessage();
            return false;
        }
    }

    /** Notify everyone connected to $primary who is allowed to see the given shared category. */
    public function notifyPartners(User $primary, string $event, string $permission, ?string $dedupeKey = null, int $minutes = 0): void
    {
        foreach ($this->partnerIdsWithPermission($primary, $permission) as $partnerId) {
            if ($dedupeKey && ! Cache::add($dedupeKey.':'.$partnerId, true, now()->addMinutes($minutes ?: 1440))) {
                continue;
            }
            $this->notify($partnerId, $event);
        }
    }

    public function partnerIdsWithPermission(User $primary, string $permission): array
    {
        $ids = [];
        $relationships = Relationship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('user_one_id', $primary->id)->orWhere('user_two_id', $primary->id))
            ->get();
        foreach ($relationships as $relationship) {
            $partnerId = (int) ($relationship->user_one_id === $primary->id ? $relationship->user_two_id : $relationship->user_one_id);
            if (! $partnerId) {
                continue;
            }
            $all = $relationship->sharing_preferences ?? [];
            $mine = $all[(string) $primary->id] ?? $all;
            if (! empty($mine[$permission])) {
                $ids[] = $partnerId;
            }
        }
        return array_values(array_unique($ids));
    }

    /** @return array{day:int|null,phase:string,period_start:string|null} */
    public function cycleSnapshot(User $user, ?CarbonImmutable $on = null): array
    {
        $profile = $user->cycleProfile;
        $timezone = $profile?->timezone ?: 'UTC';
        $today = $on ?? CarbonImmutable::today($timezone);
        $last = $user->periodLogs()->orderByDesc('start_date')->first();
        $length = (int) ($profile?->average_cycle_length ?: 0);
        if (! $last || $length < 21) {
            return ['day' => null, 'phase' => 'unknown', 'period_start' => null];
        }
        $start = CarbonImmutable::parse($last->start_date->format('Y-m-d'), $timezone)->startOfDay();
        $day = (($start->diffInDays($today->startOfDay()) % $length) + 1);
        $periodLength = max(1, (int) ($profile->average_period_length ?: 5));
        $phase = match (true) {
            $day <= $periodLength => 'menstrual',
            $day < max($periodLength + 1, $length - 13) => 'follicular',
            $day <= $length - 12 => 'ovulatory',
            default => 'luteal',
        };
        return ['day' => (int) $day, 'phase' => $phase, 'period_start' => $start->toDateString()];
    }
}
