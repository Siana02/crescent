<?php

namespace App\Http\Controllers;

use App\Models\Pregnancy;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PregnancyController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'due_date_source' => ['required', Rule::in(['due_date', 'last_period_date', 'conception_date'])],
            'due_date' => ['nullable', 'date_format:Y-m-d', 'required_if:due_date_source,due_date'],
            'last_period_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today', 'required_if:due_date_source,last_period_date'],
            'conception_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today', 'required_if:due_date_source,conception_date'],
            'wants_baby_astrology' => ['sometimes', 'boolean'],
        ]);

        $dueDate = match ($validated['due_date_source']) {
            'last_period_date' => CarbonImmutable::parse($validated['last_period_date'])->addDays(280)->toDateString(),
            'conception_date' => CarbonImmutable::parse($validated['conception_date'])->addDays(266)->toDateString(),
            default => $validated['due_date'],
        };

        $pregnancyValues = [
            'due_date' => $dueDate,
            'last_period_date' => $validated['due_date_source'] === 'last_period_date' ? $validated['last_period_date'] : null,
            'conception_date' => $validated['due_date_source'] === 'conception_date' ? $validated['conception_date'] : ($validated['conception_date'] ?? null),
            'due_date_source' => $validated['due_date_source'],
            'wants_baby_astrology' => $validated['wants_baby_astrology'] ?? false,
            'status' => 'active',
        ];
        $pregnancy = $request->user()->pregnancies()->where('status', 'active')->latest()->first();
        if ($pregnancy) {
            $pregnancy->update($pregnancyValues);
        } else {
            $pregnancy = $request->user()->pregnancies()->create($pregnancyValues);
        }

        $profile = $request->user()->cycleProfile()->firstOrCreate([], [
            'timezone' => config('app.timezone', 'UTC'),
        ]);
        $profile->update([
            'active_journey' => 'pregnancy',
            'primary_goal' => 'pregnancy_support',
            'average_cycle_length' => null,
            'average_period_length' => null,
            'onboarding_completed' => true,
        ]);

        return response()->json([
            'message' => 'Your pregnancy journey is ready.',
            'pregnancy' => [
                'due_date' => $pregnancy->due_date->format('Y-m-d'),
                'last_period_date' => $pregnancy->last_period_date?->format('Y-m-d'),
                'conception_date' => $pregnancy->conception_date?->format('Y-m-d'),
                'due_date_source' => $pregnancy->due_date_source,
                'wants_baby_astrology' => $pregnancy->wants_baby_astrology,
                'status' => $pregnancy->status,
            ],
        ], 201);
    }

    public function checkin(Request $request): JsonResponse
    {
        $pregnancy = $request->user()->pregnancies()->where('status', 'active')->latest()->firstOrFail();
        $timezone = $request->user()->cycleProfile?->timezone ?: config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone)->toDateString();

        $symptoms = [
            'nausea', 'fatigue', 'food_cravings', 'backache', 'heartburn',
            'sleep_changes', 'headache', 'swelling', 'mood_changes',
            'movement_noticed', 'constipation', 'pelvic_discomfort',
        ];

        $validated = $request->validate([
            'log_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'symptoms' => ['sometimes', 'array', 'max:12'],
            'symptoms.*' => ['string', Rule::in($symptoms)],
            'mood' => ['nullable', Rule::in(['calm', 'happy', 'tender', 'anxious', 'overwhelmed', 'irritable', 'hopeful', 'tired'])],
            'energy_level' => ['nullable', Rule::in(['low', 'balanced', 'high'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (empty($validated['symptoms']) && empty($validated['mood']) && empty($validated['energy_level']) && empty($validated['notes'])) {
            return response()->json(['message' => 'Choose one little thing to log first.'], 422);
        }

        $checkin = $pregnancy->checkins()->updateOrCreate(
            ['log_date' => $validated['log_date'] ?? $today],
            [
                'symptoms' => $validated['symptoms'] ?? [],
                'mood' => $validated['mood'] ?? null,
                'energy_level' => $validated['energy_level'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        return response()->json([
            'message' => 'Your check-in is tucked safely into your pregnancy journal.',
            'checkin' => [
                'log_date' => $checkin->log_date->format('Y-m-d'),
                'symptoms' => $checkin->symptoms ?? [],
                'mood' => $checkin->mood,
                'energy_level' => $checkin->energy_level,
                'notes' => $checkin->notes,
            ],
        ], 201);
    }

    public function transitionPostpartum(Request $request): JsonResponse
    {
        $pregnancy = $request->user()->pregnancies()->where('status', 'active')->latest()->firstOrFail();
        $pregnancy->update(['status' => 'postpartum']);

        $profile = $request->user()->cycleProfile()->firstOrCreate([], [
            'timezone' => config('app.timezone', 'UTC'),
        ]);
        $profile->update([
            'active_journey' => 'postpartum',
            'primary_goal' => 'postpartum_support',
            'average_cycle_length' => null,
            'average_period_length' => null,
        ]);

        return response()->json(['message' => 'Your postpartum and newborn space is ready. Your pregnancy history remains saved.']);
    }

    public function postpartumCheckin(Request $request): JsonResponse
    {
        $pregnancy = $request->user()->pregnancies()->where('status', 'postpartum')->latest()->firstOrFail();
        $timezone = $request->user()->cycleProfile?->timezone ?: config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone)->toDateString();

        $validated = $request->validate([
            'log_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'category' => ['required', Rule::in(['feeding', 'sleep', 'diaper', 'parent_wellbeing', 'note'])],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $log = $pregnancy->postpartumLogs()->create([
            'log_date' => $validated['log_date'] ?? $today,
            'category' => $validated['category'],
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'message' => 'Your postpartum note has been saved in your private journal.',
            'log' => [
                'id' => $log->id,
                'log_date' => $log->log_date->format('Y-m-d'),
                'category' => $log->category,
                'notes' => $log->notes,
            ],
        ], 201);
    }

    public function returnToCycle(Request $request): JsonResponse
    {
        $request->user()->pregnancies()->where('status', 'postpartum')->latest()->firstOrFail();
        $profile = $request->user()->cycleProfile()->firstOrCreate([], [
            'timezone' => config('app.timezone', 'UTC'),
        ]);
        $profile->update([
            'active_journey' => 'cycle',
            'primary_goal' => 'track_cycle',
            'average_cycle_length' => null,
            'average_period_length' => null,
        ]);

        return response()->json(['message' => 'Cycle tracking is ready whenever you are. Your pregnancy and postpartum notes remain saved.']);
    }
}
