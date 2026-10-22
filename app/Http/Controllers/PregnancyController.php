<?php

namespace App\Http\Controllers;

use App\Models\Pregnancy;
use App\Models\PregnancyReminder;
use App\Models\Relationship;
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
        $validated = $request->validate([
            'baby_name' => ['nullable', 'string', 'max:80'],
            'baby_birth_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'baby_birth_time' => ['nullable', 'date_format:H:i'],
            'baby_birth_place' => ['nullable', 'string', 'max:180'],
        ]);
        $pregnancy = $request->user()->pregnancies()->where('status', 'active')->latest()->firstOrFail();
        $pregnancy->update([
            'status' => 'postpartum',
            'baby_name' => $validated['baby_name'] ?? null,
            'baby_birth_date' => $validated['baby_birth_date'],
            'baby_birth_time' => $validated['baby_birth_time'] ?? null,
            'baby_birth_place' => $validated['baby_birth_place'] ?? null,
        ]);

        $profile = $request->user()->cycleProfile()->firstOrCreate([], [
            'timezone' => config('app.timezone', 'UTC'),
        ]);
        $profile->update([
            'active_journey' => 'postpartum',
            'primary_goal' => 'postpartum_support',
            'average_cycle_length' => null,
            'average_period_length' => null,
        ]);

        return response()->json([
            'message' => 'Your postpartum and newborn space is ready. Your pregnancy history remains saved.',
            'baby' => ['name' => $pregnancy->baby_name, 'birth_date' => $pregnancy->baby_birth_date?->format('Y-m-d'), 'birth_time' => $pregnancy->baby_birth_time, 'birth_place' => $pregnancy->baby_birth_place],
        ]);
    }

    public function reminders(Request $request): JsonResponse
    {
        $user = $request->user();
        $ownPregnancy = $user->pregnancies()->whereIn('status', ['active', 'postpartum'])->latest()->first();
        if ($ownPregnancy) {
            $reminders = $ownPregnancy->reminders()->with('creator:id,name')->orderBy('remind_at')->get();
        } else {
            $relationshipIds = Relationship::query()->where('status', 'accepted')
                ->where(function ($query) use ($user) {
                    $query->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
                })->get();
            $otherIds = $relationshipIds->map(fn ($relationship) => $relationship->user_one_id === $user->id ? $relationship->user_two_id : $relationship->user_one_id);
            $pregnancyIds = Pregnancy::query()->whereIn('user_id', $otherIds)->whereIn('status', ['active', 'postpartum'])->pluck('id');
            $reminders = PregnancyReminder::query()->whereIn('pregnancy_id', $pregnancyIds)->where('share_with_partner', true)->with('creator:id,name')->orderBy('remind_at')->get();
        }

        return response()->json(['reminders' => $reminders->map(fn ($reminder) => [
            'id' => $reminder->id, 'title' => $reminder->title, 'category' => $reminder->category,
            'remind_at' => $reminder->remind_at?->toIso8601String(), 'notes' => $reminder->notes,
            'share_with_partner' => (bool) $reminder->share_with_partner, 'completed_at' => $reminder->completed_at?->toIso8601String(),
            'created_by_name' => $reminder->creator?->name,
        ])->values()]);
    }

    public function storeReminder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'category' => ['required', Rule::in(['appointment', 'shopping', 'class', 'medication', 'support', 'other'])],
            'remind_at' => ['required', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'share_with_partner' => ['sometimes', 'boolean'],
        ]);
        $pregnancy = $request->user()->pregnancies()->whereIn('status', ['active', 'postpartum'])->latest()->firstOrFail();
        $reminder = $pregnancy->reminders()->create([
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'remind_at' => $validated['remind_at'],
            'notes' => $validated['notes'] ?? null,
            'share_with_partner' => (bool) ($validated['share_with_partner'] ?? false),
        ]);

        return response()->json(['message' => $reminder->share_with_partner ? 'Reminder saved and shared with your connected partner.' : 'Reminder saved in your private pregnancy planner.', 'reminder' => $reminder], 201);
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
            'cycle_tracking_started_at' => CarbonImmutable::today($profile->timezone ?: config('app.timezone', 'UTC'))->toDateString(),
        ]);

        return response()->json(['message' => 'Cycle tracking is ready whenever you are. Your pregnancy and postpartum notes remain saved.']);
    }
}
