<?php

namespace App\Http\Controllers;

use App\Models\Relationship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RelationshipController extends Controller
{
    public function invite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'relationship_type' => ['required', Rule::in(['observer', 'co_tracker'])],
            'sharing_preferences' => ['sometimes', 'array'],
            'sharing_preferences.cycle_details' => ['sometimes', 'boolean'],
            'sharing_preferences.pregnancy_details' => ['sometimes', 'boolean'],
            'sharing_preferences.wellbeing_updates' => ['sometimes', 'boolean'],
            'sharing_preferences.astrology' => ['sometimes', 'boolean'],
        ]);
        if (($request->user()->cycleProfile?->relationship_role ?? 'tracker') === 'support') {
            throw ValidationException::withMessages([
                'relationship_type' => 'Support-partner accounts join an invitation rather than create a tracking connection.',
            ]);
        }

        $sharing = array_merge([
            'cycle_details' => false,
            'pregnancy_details' => false,
            'wellbeing_updates' => false,
            'astrology' => false,
        ], $validated['sharing_preferences'] ?? []);

        $relationship = Relationship::create([
            'user_one_id' => $request->user()->id,
            'relationship_type' => $validated['relationship_type'],
            'status' => 'pending',
            'invite_code' => Str::upper(Str::random(8)),
            'sharing_preferences' => [(string) $request->user()->id => $sharing],
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'relationship_id' => $relationship->id,
            'invite_code' => $relationship->invite_code,
            'relationship_type' => $relationship->relationship_type,
            'status' => $relationship->status,
        ], 201);
    }

    public function sharing(Relationship $relationship, Request $request): JsonResponse
    {
        abort_unless(
            $relationship->status === 'accepted'
            && in_array($request->user()->id, [$relationship->user_one_id, $relationship->user_two_id], true),
            404
        );

        if ($relationship->relationship_type === 'observer' && $request->user()->id !== $relationship->user_one_id) {
            abort(403, 'Only the person who created this support invitation can change what they share.');
        }

        $validated = $request->validate([
            'cycle_details' => ['sometimes', 'boolean'],
            'pregnancy_details' => ['sometimes', 'boolean'],
            'wellbeing_updates' => ['sometimes', 'boolean'],
            'astrology' => ['sometimes', 'boolean'],
        ]);
        $defaults = [
            'cycle_details' => false,
            'pregnancy_details' => false,
            'wellbeing_updates' => false,
            'astrology' => false,
        ];
        $allPreferences = $relationship->sharing_preferences ?? [];
        $userKey = (string) $request->user()->id;
        $existing = $allPreferences[$userKey] ?? [];
        if ($existing === [] && array_key_exists('cycle_details', $allPreferences)) {
            $existing = $allPreferences;
        }
        $preferences = array_merge($defaults, $existing, $validated);
        $allPreferences[$userKey] = $preferences;
        foreach (['cycle_details', 'pregnancy_details', 'wellbeing_updates', 'astrology'] as $key) {
            unset($allPreferences[$key]);
        }
        $relationship->update(['sharing_preferences' => $allPreferences]);

        return response()->json(['sharing_preferences' => $preferences]);
    }

    public function companionBirthDetails(Relationship $relationship, Request $request): JsonResponse
    {
        abort_unless(
            $relationship->status === 'accepted'
            && $relationship->relationship_type === 'observer'
            && $request->user()->id === $relationship->user_one_id,
            404
        );

        $preferences = $relationship->sharing_preferences ?? [];
        $primaryPreferences = $preferences[(string) $relationship->user_one_id] ?? $preferences;
        abort_unless((bool) ($primaryPreferences['astrology'] ?? false), 403, 'Enable astrology sharing before editing your companion’s birth details.');

        $validated = $request->validate([
            'birth_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'birth_time' => ['nullable', 'date_format:H:i'],
            'birth_place' => ['nullable', 'string', 'max:160'],
        ]);

        $companion = $relationship->companion;
        abort_unless($companion, 404);
        $profile = $companion->cycleProfile()->firstOrCreate([], [
            'relationship_role' => 'support',
            'onboarding_completed' => true,
            'cycle_regularity' => 'unknown',
            'timezone' => config('app.timezone', 'UTC'),
        ]);
        $profile->update([
            'birth_date' => $validated['birth_date'],
            'birth_time' => $validated['birth_time'] ?? null,
            'birth_place' => $validated['birth_place'] ?? null,
            'wants_astrology' => true,
            'sun_sign' => $this->sunSign($validated['birth_date']),
        ]);

        return response()->json(['birth_details' => [
            'birth_date' => $profile->birth_date?->format('Y-m-d'),
            'birth_time' => $profile->birth_time,
            'birth_place' => $profile->birth_place,
            'sun_sign' => $profile->sun_sign,
        ]]);
    }

    private function sunSign(string $date): string
    {
        $monthDay = (int) date('md', strtotime($date));

        return match (true) {
            $monthDay >= 321 && $monthDay <= 419 => 'Aries',
            $monthDay >= 420 && $monthDay <= 520 => 'Taurus',
            $monthDay >= 521 && $monthDay <= 620 => 'Gemini',
            $monthDay >= 621 && $monthDay <= 722 => 'Cancer',
            $monthDay >= 723 && $monthDay <= 822 => 'Leo',
            $monthDay >= 823 && $monthDay <= 922 => 'Virgo',
            $monthDay >= 923 && $monthDay <= 1022 => 'Libra',
            $monthDay >= 1023 && $monthDay <= 1121 => 'Scorpio',
            $monthDay >= 1122 && $monthDay <= 1221 => 'Sagittarius',
            $monthDay >= 1222 || $monthDay <= 119 => 'Capricorn',
            $monthDay >= 120 && $monthDay <= 218 => 'Aquarius',
            default => 'Pisces',
        };
    }

    public function accept(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invite_code' => ['required', 'string', 'size:8'],
        ]);

        $relationship = Relationship::where('invite_code', Str::upper($validated['invite_code']))
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (! $relationship) {
            throw ValidationException::withMessages([
                'invite_code' => 'That Cosmic Sync Code is not active. Ask your companion for a fresh one.',
            ]);
        }

        $profile = $request->user()->cycleProfile;
        if ($relationship->relationship_type === 'observer'
            && (($profile?->relationship_role ?? 'tracker') !== 'support')) {
            throw ValidationException::withMessages([
                'invite_code' => 'This is a support-partner invitation. Register or sign in with the support-partner role to join.',
            ]);
        }

        if ($relationship->relationship_type === 'co_tracker'
            && (($profile?->relationship_role ?? 'tracker') === 'support' || ! $profile?->onboarding_completed)) {
            throw ValidationException::withMessages([
                'invite_code' => 'Complete your own cycle or pregnancy setup before joining a co-tracking connection.',
            ]);
        }

        if ($relationship->user_one_id === $request->user()->id) {
            throw ValidationException::withMessages([
                'invite_code' => 'You cannot accept your own invitation.',
            ]);
        }

        if ($relationship->user_two_id !== null) {
            throw ValidationException::withMessages([
                'invite_code' => 'That invitation has already been used.',
            ]);
        }

        $relationship->update([
            'user_two_id' => $request->user()->id,
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        return response()->json([
            'message' => 'Your Crescent spaces are now connected. You can review sharing preferences before sharing cycle details.',
            'relationship_id' => $relationship->id,
            'relationship_type' => $relationship->relationship_type,
            'status' => $relationship->status,
        ]);
    }
}
