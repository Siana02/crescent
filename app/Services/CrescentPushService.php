<?php

namespace App\Services;

use App\Models\NotificationPreference;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class CrescentPushService
{
    /**
     * Send a privacy-preserving notification to opted-in devices.
     * Event types are intentionally allow-listed; arbitrary message bodies are not accepted.
     */
    public function notify(int $userId, string $event, ?string $senderName = null): bool
    {
        $preferences = NotificationPreference::where('user_id', $userId)->first();
        if (! $preferences || ! $preferences->push_enabled) {
            return false;
        }
        $safeSenderName = trim(preg_replace('/[\r\n\t]+/', ' ', strip_tags($senderName ?: 'your partner')) ?? 'your partner');
        $safeSenderName = mb_substr($safeSenderName !== '' ? $safeSenderName : 'your partner', 0, 60);

        $allowed = [
            'shared_note' => ['enabled' => $preferences->shared_notes, 'title' => 'A note from your partner'],
            'partner_update' => ['enabled' => $preferences->partner_updates, 'title' => 'A partner update'],
            'cycle_reminder' => ['enabled' => $preferences->cycle_reminders, 'title' => 'A gentle Crescent reminder'],
            'daily_checkin' => ['enabled' => $preferences->daily_checkin_reminders, 'title' => 'A moment for yourself'],
            'symptom_nudge' => ['enabled' => $preferences->daily_checkin_reminders, 'title' => 'A gentle nudge from ' . $safeSenderName],
        ];
        if (! isset($allowed[$event]) || ! $allowed[$event]['enabled']) {
            return false;
        }
        if (! class_exists(WebPush::class)) {
            Log::warning('Crescent push package is not installed; notification not sent.');
            return false;
        }

        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject');
        if (! $publicKey || ! $privateKey || ! $subject) {
            Log::warning('Crescent Web Push is not configured; notification not sent.');
            return false;
        }

        $webPush = new WebPush([
            'VAPID' => ['subject' => $subject, 'publicKey' => $publicKey, 'privateKey' => $privateKey],
        ]);
        foreach (PushSubscription::where('user_id', $userId)->get() as $stored) {
            $subscription = Subscription::create([
                'endpoint' => $stored->endpoint,
                'publicKey' => $stored->public_key,
                'authToken' => $stored->auth_token,
                'contentEncoding' => $stored->content_encoding,
            ]);
            // The explicit symptom-nudge event includes only the sender's display name and reminder intent; no symptom values, cycle dates, or note contents are sent.
            $body = $event === 'symptom_nudge' ? $safeSenderName . ' has nudged you to log your symptoms today.' : 'You have a new update in Crescent.';
            $payload = json_encode([
                'title' => $event === 'symptom_nudge' ? 'A gentle nudge from ' . $safeSenderName : $allowed[$event]['title'],
                'body' => $body,
                'url' => '/dashboard',
                'tag' => 'crescent-' . $event,
            ], JSON_THROW_ON_ERROR);
            $webPush->queueNotification($subscription, $payload);
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
            Log::info('Crescent push delivery failed.', ['reason' => $report->getReason()]);
        }

        return $delivered;
    }
}
