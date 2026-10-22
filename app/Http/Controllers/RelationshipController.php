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
        ]);

        $relationship = Relationship::create([
            'user_one_id' => $request->user()->id,
            'relationship_type' => $validated['relationship_type'],
            'status' => 'pending',
            'invite_code' => Str::upper(Str::random(8)),
            'sharing_preferences' => ['cycle_details' => false, 'pregnancy_details' => false, 'wellbeing_updates' => false, 'astrology' => false],
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
