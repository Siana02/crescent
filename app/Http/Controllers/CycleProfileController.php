<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CycleProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'average_cycle_length' => ['nullable', 'integer', 'between:21,45'],
            'average_period_length' => ['nullable', 'integer', 'between:1,10'],
            'cycle_regularity' => ['sometimes', 'in:regular,irregular,unknown'],
            'timezone' => ['required', 'string', 'timezone'],
            'display_name' => ['nullable', 'string', 'max:100'],
            'wants_astrology' => ['sometimes', 'boolean'],
            'partner_preference' => ['sometimes', Rule::in(['solo', 'observer', 'co_tracker'])],
            'relationship_role' => ['sometimes', Rule::in(['tracker', 'support'])],
            'birth_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'contraception_type' => ['nullable', Rule::in(['none', 'pill', 'hormonal_iud', 'copper_iud', 'implant', 'injection', 'patch', 'ring', 'other', 'prefer_not_to_say'])],
            'primary_goal' => ['sometimes', Rule::in(['track_cycle', 'predict_moon', 'manage_symptoms', 'cosmic_cycle', 'fertility_support', 'trying_to_conceive', 'pregnancy_support', 'postpartum_support'])],
            'active_journey' => ['sometimes', Rule::in(['cycle', 'fertility', 'pregnancy', 'postpartum'])],
            'birth_time' => ['nullable', 'date_format:H:i'],
            'birth_place' => ['nullable', 'string', 'max:160'],
            'moon_sign' => ['nullable', Rule::in(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'])],
            'rising_sign' => ['nullable', Rule::in(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'])],
            'onboarding_completed' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('relationship_role', $validated)
            && $validated['relationship_role'] !== ($request->user()->cycleProfile?->relationship_role ?? 'tracker')) {
            abort(403, 'Your Crescent relationship role cannot be changed from profile settings.');
        }

        if (array_key_exists('birth_date', $validated)) {
            $validated['sun_sign'] = $validated['birth_date'] ? $this->sunSign($validated['birth_date']) : null;
        }

        $profile = $request->user()->cycleProfile()->updateOrCreate([], $validated);

        return response()->json([
            'profile' => [
                'average_cycle_length' => $profile->average_cycle_length,
                'average_period_length' => $profile->average_period_length,
                'cycle_regularity' => $profile->cycle_regularity,
                'timezone' => $profile->timezone,
                'birth_date' => $profile->birth_date?->format('Y-m-d'),
                'contraception_type' => $profile->contraception_type,
                'primary_goal' => $profile->primary_goal,
                'birth_time' => $profile->birth_time,
                'birth_place' => $profile->birth_place,
                'sun_sign' => $profile->sun_sign,
                'moon_sign' => $profile->moon_sign,
                'rising_sign' => $profile->rising_sign,
                'onboarding_completed' => $profile->onboarding_completed,
                'display_name' => $profile->display_name,
                'wants_astrology' => $profile->wants_astrology,
                'partner_preference' => $profile->partner_preference,
                'relationship_role' => $profile->relationship_role ?? 'tracker',
                'active_journey' => $profile->active_journey ?? 'cycle',
            ],
        ]);
    }

    public function astrologyConsent(Request $request): JsonResponse
    {
        $validated = $request->validate(['wants_astrology' => ['required', 'boolean']]);
        $profile = $request->user()->cycleProfile;
        abort_unless($profile, 409, 'Complete your profile setup before opting in to astrology.');
        $profile->update(['wants_astrology' => (bool) $validated['wants_astrology']]);

        return response()->json(['wants_astrology' => (bool) $profile->wants_astrology]);
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
}
