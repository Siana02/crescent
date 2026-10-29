<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PushNotificationController extends Controller
{
    public function publicKey(): JsonResponse
    {
        $key = config('services.webpush.public_key');
        if (! is_string($key) || $key === '') {
            return response()->json(['message' => 'Push notifications are not configured yet.'], 503);
        }

        return response()->json(['public_key' => $key]);
    }

    public function preferences(Request $request): JsonResponse
    {
        $preferences = NotificationPreference::firstOrCreate(['user_id' => $request->user()->id]);
        return response()->json([
            'preferences' => $preferences,
            'subscription_count' => PushSubscription::where('user_id', $request->user()->id)->count(),
            'configured' => (bool) config('services.webpush.public_key') && (bool) config('services.webpush.private_key'),
        ]);
    }

    public function savePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'push_enabled' => ['sometimes', 'boolean'],
            'shared_notes' => ['sometimes', 'boolean'],
            'partner_updates' => ['sometimes', 'boolean'],
            'cycle_reminders' => ['sometimes', 'boolean'],
            'daily_checkin_reminders' => ['sometimes', 'boolean'],
            // Private previews remain off by default; only neutral previews are recommended.
            'private_previews' => ['sometimes', 'boolean'],
        ]);
        if (($validated['private_previews'] ?? false) === true) {
            return response()->json(['message' => 'Private message previews are not supported. Crescent uses neutral lock-screen notifications to protect your privacy.'], 422);
        }
        $preferences = NotificationPreference::updateOrCreate(
            ['user_id' => $request->user()->id],
            array_merge($validated, ['private_previews' => false])
        );
        return response()->json(['preferences' => $preferences]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:4096'],
            'keys.p256dh' => ['required', 'string', 'max:512'],
            'keys.auth' => ['required', 'string', 'max:512'],
            'contentEncoding' => ['nullable', 'in:aes128gcm,aesgcm'],
        ]);
        $endpoint = $validated['endpoint'];
        if (! in_array(parse_url($endpoint, PHP_URL_SCHEME), ['https'], true)) {
            return response()->json(['message' => 'Push endpoints must use HTTPS.'], 422);
        }

        PushSubscription::updateOrCreate(
            ['endpoint_hash' => hash('sha256', $endpoint)],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $endpoint,
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'content_encoding' => $validated['contentEncoding'] ?? 'aes128gcm',
            ]
        );
        NotificationPreference::updateOrCreate(['user_id' => $request->user()->id], ['push_enabled' => true, 'private_previews' => false]);
        return response()->json(['message' => 'This device is subscribed to Crescent notifications.'], 201);
    }

    public function test(Request $request): JsonResponse
    {
        $delivered = app(\App\Services\CrescentPushService::class)->notify((int) $request->user()->id, 'test');
        if (! $delivered) {
            return response()->json(['message' => 'We could not deliver a test notification. Check that push is enabled on this device and that the server has VAPID keys.'], 422);
        }
        return response()->json(['message' => 'Test notification sent. It should arrive in a moment.']);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate(['endpoint' => ['required', 'url', 'max:4096']]);
        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', hash('sha256', $validated['endpoint']))
            ->delete();
        if (! PushSubscription::where('user_id', $request->user()->id)->exists()) {
            NotificationPreference::updateOrCreate(['user_id' => $request->user()->id], ['push_enabled' => false]);
        }
        return response()->json(['message' => 'This device has been unsubscribed.']);
    }
}
