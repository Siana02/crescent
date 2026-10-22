<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'relationship_role' => ['sometimes', 'in:tracker,support'],
        ]);

        $role = $validated['relationship_role'] ?? 'tracker';
        unset($validated['relationship_role']);
        $user = User::create($validated);
        if ($role === 'support') {
            $user->cycleProfile()->updateOrCreate([], [
                'relationship_role' => 'support',
                'onboarding_completed' => true,
                'cycle_regularity' => 'unknown',
                'timezone' => config('app.timezone', 'UTC'),
                'primary_goal' => 'track_cycle',
                'partner_preference' => 'solo',
            ]);
        }
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => ['name' => $user->name, 'email' => $user->email],
            'relationship_role' => $role,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
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
