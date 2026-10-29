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
        'libido_decrease', 'sweet_cravings', 'savoury_cravings', 'overwhelmed', 'moody',
    ];

    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->cycleProfile;
        $timezone = $profile?->timezone ?: config('app.timezone', 'UTC');
        if ($request->boolean('dates')) {
            return response()->json([
                'dates' => $request->user()->dailyCheckins()->orderBy('log_date')->pluck('log_date')->map(fn ($date) => CarbonImmutable::parse($date, $timezone)->format('Y-m-d'))->values(),
            ]);
        }

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.CarbonImmutable::today($timezone)->toDateString()],
        ]);

        $checkin = $request->user()->dailyCheckins()->whereDate('log_date', $validated['date'])->first();

        return response()->json([
            'checkin' => $checkin ? [
                'log_date' => $checkin->log_date->format('Y-m-d'),
                'energy_level' => $checkin->energy_level,
                'mood' => $checkin->mood ? explode(',', $checkin->mood) : [],
                'symptoms' => $checkin->symptoms ?? [],
                'notes' => $checkin->notes,
            ] : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $moodInput = $request->input('mood');
        if (is_string($moodInput)) {
            $request->merge(['mood' => trim($moodInput) !== '' ? [$moodInput] : null]);
        }

        $profile = $request->user()->cycleProfile()->firstOrCreate([]);
        $today = CarbonImmutable::today($profile->timezone ?: 'UTC')->toDateString();

        $validated = $request->validate([
            'log_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'energy_level' => ['nullable', Rule::in(['low', 'balanced', 'high', 'peak'])],
            'mood' => ['nullable', 'array', 'max:12'],
            'mood.*' => ['string', Rule::in(['calm', 'irritated', 'intuitive', 'anxious', 'happy', 'tender', 'focused', 'overwhelmed', 'moody', 'zen', 'playful', 'sensitive'])],
            'symptoms' => ['sometimes', 'array', 'max:60'],
            'symptoms.*' => ['string', Rule::in(self::SYMPTOMS)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $logDate = $validated['log_date'] ?? $today;
        $checkins = $request->user()->dailyCheckins();
        $checkin = $checkins->whereDate('log_date', $logDate)->first();

        if (! $checkin && ! collect(['energy_level', 'mood', 'symptoms', 'notes'])->contains(fn ($field) => array_key_exists($field, $validated) && $validated[$field] !== null && $validated[$field] !== [] && $validated[$field] !== '')) {
            return response()->json(['message' => 'Choose at least one thing to check in with.'], 422);
        }

        $attributes = [];
        if (array_key_exists('energy_level', $validated)) {
            $attributes['energy_level'] = $validated['energy_level'];
        }
        if (array_key_exists('mood', $validated)) {
            $attributes['mood'] = ! empty($validated['mood']) ? implode(',', $validated['mood']) : null;
        }
        if (array_key_exists('symptoms', $validated)) {
            $attributes['symptoms'] = $validated['symptoms'] ?? [];
        }
        if (array_key_exists('notes', $validated)) {
            $attributes['notes'] = $validated['notes'];
        }

        if ($checkin) {
            $checkin->fill($attributes);
            $checkin->save();
        } else {
            $checkin = $checkins->create(array_merge(['log_date' => $logDate], $attributes));
        }

        if (! empty($checkin->symptoms)) {
            try {
                app(\App\Services\CrescentPushService::class)->notifyPartners($request->user(), 'partner_symptoms', 'wellbeing_updates', 'crescent:partner-symptoms:'.$request->user()->id, 120);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return response()->json([
            'checkin' => [
                'log_date' => $checkin->log_date->format('Y-m-d'),
                'energy_level' => $checkin->energy_level,
                'mood' => $checkin->mood ? explode(',', $checkin->mood) : [],
                'symptoms' => $checkin->symptoms ?? [],
                'notes' => $checkin->notes,
            ],
            'message' => 'Your check-in is saved in your private space.',
        ], 201);
    }
}
