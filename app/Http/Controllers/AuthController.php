<?php

namespace App\Http\Controllers;

use App\Models\Relationship;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function invitationPreview(Request $request): JsonResponse
    {
        $validated = $request->validate(['code' => ['required', 'string', 'size:8']]);
        $relationship = Relationship::where('invite_code', strtoupper($validated['code']))
            ->where('status', 'pending')
            ->whereNull('user_two_id')
            ->where('expires_at', '>', now())
            ->first();

        if (! $relationship) {
            throw ValidationException::withMessages([
                'code' => 'That Cosmic Sync Code is not active. Ask your companion for a fresh one.',
            ]);
        }

        $preferences = $relationship->sharing_preferences ?? [];
        $initiatorPreferences = $preferences[(string) $relationship->user_one_id] ?? $preferences;

        return response()->json([
            'relationship_type' => $relationship->relationship_type,
            'astrology_enabled' => (bool) ($initiatorPreferences['astrology'] ?? false),
            'requires_birth_date' => $relationship->relationship_type === 'observer' && (bool) ($initiatorPreferences['astrology'] ?? false),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'relationship_role' => ['sometimes', 'in:tracker,support'],
            'registration_intent' => ['sometimes', 'in:tracker,support,co_tracker'],
            'invite_code' => ['nullable', 'string', 'size:8'],
            'birth_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'birth_time' => ['nullable', 'date_format:H:i'],
            'birth_place' => ['nullable', 'string', 'max:160'],
        ]);

        $intent = $validated['registration_intent'] ?? ($validated['relationship_role'] ?? 'tracker');
        $role = $intent === 'support' ? 'support' : 'tracker';
        $inviteCode = isset($validated['invite_code']) ? strtoupper($validated['invite_code']) : null;
        $relationship = null;
        $astrologyEnabled = false;

        if (in_array($intent, ['support', 'co_tracker'], true) && ! $inviteCode) {
            throw ValidationException::withMessages([
                'invite_code' => 'Enter your partner’s 8-character Cosmic Sync Code to continue.',
            ]);
        }

        if ($inviteCode) {
            $relationship = Relationship::where('invite_code', $inviteCode)
                ->where('status', 'pending')
                ->whereNull('user_two_id')
                ->where('expires_at', '>', now())
                ->first();

            if (! $relationship) {
                throw ValidationException::withMessages([
                    'invite_code' => 'That Cosmic Sync Code is not active. Ask your companion for a fresh one.',
                ]);
            }

            if ($intent === 'tracker' && $relationship->relationship_type === 'observer') {
                throw ValidationException::withMessages([
                    'invite_code' => 'This is a support-partner invitation. Choose “I’m here to support my partner” before continuing.',
                ]);
            }
            if ($intent === 'tracker' && $relationship->relationship_type === 'co_tracker') {
                throw ValidationException::withMessages([
                    'invite_code' => 'This is a co-cycling invitation. Choose “I’m joining a co-cycling connection” before continuing.',
                ]);
            }

            $expectedType = $intent === 'co_tracker' ? 'co_tracker' : ($intent === 'support' ? 'observer' : null);
            if ($expectedType && $relationship->relationship_type !== $expectedType) {
                throw ValidationException::withMessages([
                    'invite_code' => $expectedType === 'co_tracker'
                        ? 'This code is for a support connection. Choose “I’m here to support my partner” instead.'
                        : 'This code is for co-cycling. Choose “I’m joining a co-cycling connection” instead.',
                ]);
            }

            $preferences = $relationship->sharing_preferences ?? [];
            $initiatorPreferences = $preferences[(string) $relationship->user_one_id] ?? $preferences;
            $astrologyEnabled = (bool) ($initiatorPreferences['astrology'] ?? false);

            if (in_array($intent, ['support', 'co_tracker'], true) && $astrologyEnabled && empty($validated['birth_date'])) {
                throw ValidationException::withMessages([
                    'birth_date' => 'Your partner has enabled astrology. Add your birth date to set up your shared sky reflections.',
                ]);
            }
        }

        $user = DB::transaction(function () use ($validated, $role, $intent, $relationship, &$astrologyEnabled) {
            if ($relationship) {
                $lockedRelationship = Relationship::whereKey($relationship->id)->lockForUpdate()->first();
                if (! $lockedRelationship || $lockedRelationship->status !== 'pending' || $lockedRelationship->user_two_id !== null || ! $lockedRelationship->expires_at?->isFuture()) {
                    throw ValidationException::withMessages([
                        'invite_code' => 'That Cosmic Sync Code has already been used or expired. Ask your companion for a fresh one.',
                    ]);
                }
                $relationship = $lockedRelationship;
                $lockedPreferences = $relationship->sharing_preferences ?? [];
                $lockedInitiatorPreferences = $lockedPreferences[(string) $relationship->user_one_id] ?? $lockedPreferences;
                $astrologyEnabled = (bool) ($lockedInitiatorPreferences['astrology'] ?? false);
                if (in_array($intent, ['support', 'co_tracker'], true) && $astrologyEnabled && empty($validated['birth_date'])) {
                    throw ValidationException::withMessages([
                        'birth_date' => 'Your partner has enabled astrology. Add your birth date to set up your shared sky reflections.',
                    ]);
                }
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            if ($role === 'support') {
                $user->cycleProfile()->updateOrCreate([], [
                    'relationship_role' => 'support',
                    'onboarding_completed' => true,
                    'cycle_regularity' => 'unknown',
                    'timezone' => config('app.timezone', 'UTC'),
                    'primary_goal' => 'track_cycle',
                    'partner_preference' => 'solo',
                    'wants_astrology' => $astrologyEnabled,
                    'birth_date' => $validated['birth_date'] ?? null,
                    'birth_time' => $validated['birth_time'] ?? null,
                    'birth_place' => $validated['birth_place'] ?? null,
                    'sun_sign' => ! empty($validated['birth_date']) ? $this->sunSign($validated['birth_date']) : null,
                ]);

                $relationship?->update([
                    'user_two_id' => $user->id,
                    'status' => 'accepted',
                    'accepted_at' => now(),
                ]);
            } elseif ($intent === 'co_tracker') {
                $user->cycleProfile()->updateOrCreate([], [
                    'relationship_role' => 'tracker',
                    'onboarding_completed' => false,
                    'cycle_regularity' => 'unknown',
                    'timezone' => config('app.timezone', 'UTC'),
                    'primary_goal' => 'track_cycle',
                    'partner_preference' => 'co_tracker',
                    'wants_astrology' => $astrologyEnabled,
                    'birth_date' => $validated['birth_date'] ?? null,
                    'birth_time' => $validated['birth_time'] ?? null,
                    'birth_place' => $validated['birth_place'] ?? null,
                    'sun_sign' => ! empty($validated['birth_date']) ? $this->sunSign($validated['birth_date']) : null,
                ]);
            }

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => ['name' => $user->name, 'email' => $user->email],
            'relationship_role' => $role,
            'registration_intent' => $intent,
            'onboarding_completed' => $role === 'support',
            'astrology_enabled' => $astrologyEnabled,
        ], 201);
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

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt([...$credentials, 'is_active' => true])) {
            return response()->json([
                'message' => 'Those details did not match our records. Please try again.',
            ], 422);
        }

        $request->session()->regenerate();

        $profile = $request->user()->cycleProfile;

        return response()->json([
            'user' => ['name' => $request->user()->name, 'email' => $request->user()->email],
            'relationship_role' => $profile?->relationship_role ?? 'tracker',
            'onboarding_completed' => (bool) $profile?->onboarding_completed,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'You have been signed out.']);
    }
}
