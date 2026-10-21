<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DailyCheckinController extends Controller
{
    private const SYMPTOMS = [
        'cramps', 'bloating', 'headache', 'tender_breasts', 'breast_tenderness', 'breast_swelling', 'acne',
        'fatigue', 'radiant_skin', 'backache', 'lower_back_pain', 'pelvic_pain', 'one_sided_pain', 'leg_pain',
        'painful_bowel_movement', 'painful_urination', 'migraine', 'dizziness', 'joint_pain', 'muscle_aches',
        'light_sensitivity', 'water_retention', 'oily_skin', 'dry_skin', 'hair_changes', 'nausea', 'constipation',
        'diarrhea', 'gas', 'appetite_increase', 'appetite_decrease', 'food_cravings', 'watery_discharge',
        'creamy_discharge', 'eggwhite_discharge', 'sticky_discharge', 'dryness', 'itching', 'unusual_odor',
        'spotting', 'heavy_bleeding', 'low_energy', 'high_energy', 'insomnia', 'sleepiness', 'anxiety',
        'irritability', 'low_mood', 'mood_swings', 'brain_fog', 'difficulty_concentrating', 'libido_increase',
        'libido_decrease',
    ];

    public function store(Request $request): JsonResponse
    {
        $profile = $request->user()->cycleProfile()->firstOrCreate([]);
        $today = CarbonImmutable::today($profile->timezone ?: 'UTC')->toDateString();

        $validated = $request->validate([
            'log_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'energy_level' => ['nullable', Rule::in(['low', 'balanced', 'high', 'peak'])],
            'mood' => ['nullable', Rule::in(['calm', 'irritated', 'intuitive', 'anxious', 'happy', 'tender', 'focused', 'overwhelmed'])],
            'symptoms' => ['sometimes', 'array', 'max:60'],
            'symptoms.*' => ['string', Rule::in(self::SYMPTOMS)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (empty($validated['energy_level']) && empty($validated['mood']) && empty($validated['symptoms']) && empty($validated['notes'])) {
            return response()->json(['message' => 'Choose at least one thing to check in with.'], 422);
        }

        $checkin = $request->user()->dailyCheckins()->updateOrCreate(
            ['log_date' => $validated['log_date'] ?? $today],
            [
                'energy_level' => $validated['energy_level'] ?? null,
                'mood' => $validated['mood'] ?? null,
                'symptoms' => $validated['symptoms'] ?? [],
                'notes' => $validated['notes'] ?? null,
            ],
        );

        return response()->json([
            'checkin' => [
                'log_date' => $checkin->log_date->format('Y-m-d'),
                'energy_level' => $checkin->energy_level,
                'mood' => $checkin->mood,
                'symptoms' => $checkin->symptoms ?? [],
                'notes' => $checkin->notes,
            ],
            'message' => 'Your check-in is saved in your private space.',
        ], 201);
    }
}
