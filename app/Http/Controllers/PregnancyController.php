<?php

namespace App\Http\Controllers;

use App\Models\Pregnancy;
use App\Models\PregnancyCheckin;
use App\Models\PregnancyReminder;
use App\Models\Relationship;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PregnancyController extends Controller
{
    public const REMINDER_CATEGORIES = ['appointment', 'scan', 'medication', 'class', 'shopping', 'wellbeing', 'support', 'other'];

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

    public const SYMPTOMS = [
        'nausea', 'vomiting', 'heartburn', 'constipation', 'appetite_changes', 'food_aversions', 'food_cravings',
        'backache', 'pelvic_discomfort', 'headache', 'breast_tenderness', 'swelling', 'muscle_discomfort',
        'fatigue', 'insomnia', 'sleep_changes',
        'anxiety', 'irritability', 'low_mood', 'feeling_overwhelmed', 'hopefulness', 'mood_changes',
        'movement_noticed', 'other_observation',
    ];

    private function checkinRules(string $today): array
    {
        return [
            'symptoms' => ['sometimes', 'array', 'max:'.count(self::SYMPTOMS)],
            'symptoms.*' => ['string', 'distinct', Rule::in(self::SYMPTOMS)],
            'mood' => ['nullable', Rule::in(['calm', 'happy', 'tender', 'anxious', 'overwhelmed', 'irritable', 'hopeful', 'tired'])],
            'energy_level' => ['nullable', Rule::in(['low', 'balanced', 'high'])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'details' => ['sometimes', 'nullable', 'array', 'max:3'],
            'details.severity' => ['sometimes', 'array', 'max:'.count(self::SYMPTOMS)],
            'details.severity.*' => ['integer', 'between:1,3'],
            'details.duration' => ['sometimes', 'array', 'max:'.count(self::SYMPTOMS)],
            'details.duration.*' => [Rule::in(['brief', 'part_of_day', 'all_day'])],
            'details.frequency' => ['sometimes', 'array', 'max:'.count(self::SYMPTOMS)],
            'details.frequency.*' => [Rule::in(['once', 'a_few_times', 'constant'])],
            'details.sleep_quality' => ['sometimes', 'nullable', Rule::in(['poor', 'fair', 'good'])],
        ];
    }

    /** Keep only per-symptom details for symptoms that were actually selected. */
    private function cleanDetails(array $validated): ?array
    {
        $details = $validated['details'] ?? [];
        $selected = $validated['symptoms'] ?? [];
        $clean = [];
        foreach (['severity', 'duration', 'frequency'] as $key) {
            $values = array_intersect_key($details[$key] ?? [], array_flip($selected));
            if ($values) {
                $clean[$key] = $values;
            }
        }
        if (! empty($details['sleep_quality'])) {
            $clean['sleep_quality'] = $details['sleep_quality'];
        }

        return $clean ?: null;
    }

    private function checkinPayload(PregnancyCheckin $checkin): array
    {
        return [
            'log_date' => $checkin->log_date->format('Y-m-d'),
            'symptoms' => $checkin->symptoms ?? [],
            'mood' => $checkin->mood,
            'energy_level' => $checkin->energy_level,
            'notes' => $checkin->notes,
            'details' => $checkin->details ?? (object) [],
        ];
    }

    /** The user's own pregnancy (active or, for history, postpartum). Never another user's. */
    private function ownPregnancy(Request $request, array $statuses = ['active', 'postpartum']): Pregnancy
    {
        return $request->user()->pregnancies()->whereIn('status', $statuses)->latest()->firstOrFail();
    }

    private function userToday(Request $request): string
    {
        return CarbonImmutable::today($request->user()->cycleProfile?->timezone ?: config('app.timezone', 'UTC'))->toDateString();
    }

    public function checkin(Request $request): JsonResponse
    {
        $pregnancy = $request->user()->pregnancies()->where('status', 'active')->latest()->firstOrFail();
        $today = $this->userToday($request);

        $validated = $request->validate(['log_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.$today]] + $this->checkinRules($today));

        if (empty($validated['symptoms']) && empty($validated['mood']) && empty($validated['energy_level']) && empty($validated['notes']) && empty($validated['details']['sleep_quality'])) {
            return response()->json(['message' => 'Choose one little thing to log first.'], 422);
        }

        $checkin = $pregnancy->checkins()->updateOrCreate(
            ['log_date' => $validated['log_date'] ?? $today],
            [
                'symptoms' => $validated['symptoms'] ?? [],
                'mood' => $validated['mood'] ?? null,
                'energy_level' => $validated['energy_level'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'details' => $this->cleanDetails($validated),
            ],
        );

        return response()->json([
            'message' => 'Your check-in is tucked safely into your pregnancy journal.',
            'checkin' => $this->checkinPayload($checkin),
        ], 201);
    }

    /** History: ?date=Y-m-d for one day, or ?from=&to= (max 400 days) for calendar markers, trends and editing. */
    public function checkins(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'from' => ['required_without:date', 'date_format:Y-m-d'],
            'to' => ['required_without:date', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $pregnancy = $this->ownPregnancy($request);
        $query = $pregnancy->checkins();
        if (isset($validated['date'])) {
            $query->whereDate('log_date', $validated['date']);
        } else {
            abort_if(CarbonImmutable::parse($validated['from'])->diffInDays(CarbonImmutable::parse($validated['to'])) > 400, 422, 'Please choose a date range of up to 400 days.');
            $query->whereDate('log_date', '>=', $validated['from'])->whereDate('log_date', '<=', $validated['to']);
        }

        return response()->json(['checkins' => $query->orderBy('log_date')->get()->map(fn ($c) => $this->checkinPayload($c))->values()]);
    }

    public function updateCheckin(Request $request, string $date): JsonResponse
    {
        validator(['date' => $date], ['date' => ['date_format:Y-m-d']])->validate();
        $pregnancy = $this->ownPregnancy($request);
        $checkin = $pregnancy->checkins()->whereDate('log_date', $date)->firstOrFail();
        $validated = $request->validate($this->checkinRules($this->userToday($request)));
        if (empty($validated['symptoms']) && empty($validated['mood']) && empty($validated['energy_level']) && empty($validated['notes']) && empty($validated['details']['sleep_quality'])) {
            return response()->json(['message' => 'Delete the entry if you would like to remove it.'], 422);
        }
        $checkin->update([
            'symptoms' => $validated['symptoms'] ?? [],
            'mood' => $validated['mood'] ?? null,
            'energy_level' => $validated['energy_level'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'details' => $this->cleanDetails($validated),
        ]);

        return response()->json(['message' => 'Your entry has been updated.', 'checkin' => $this->checkinPayload($checkin->refresh())]);
    }

    public function destroyCheckin(Request $request, string $date): JsonResponse
    {
        validator(['date' => $date], ['date' => ['date_format:Y-m-d']])->validate();
        $this->ownPregnancy($request)->checkins()->whereDate('log_date', $date)->firstOrFail()->delete();

        return response()->json(['message' => 'Your entry has been removed.']);
    }

    private function ownReminder(Request $request, PregnancyReminder $reminder): PregnancyReminder
    {
        // Only reminders on the user's own pregnancy, or ones the user created for a connected partner's pregnancy.
        $ownIds = $request->user()->pregnancies()->pluck('id');
        abort_unless($ownIds->contains($reminder->pregnancy_id) || $reminder->created_by === $request->user()->id, 403);

        return $reminder;
    }

    public function updateReminder(Request $request, PregnancyReminder $reminder): JsonResponse
    {
        $this->ownReminder($request, $reminder);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:140'],
            'category' => ['sometimes', Rule::in(self::REMINDER_CATEGORIES)],
            'remind_at' => ['sometimes', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'share_with_partner' => ['sometimes', 'boolean'],
            'completed' => ['sometimes', 'boolean'],
        ]);
        if (array_key_exists('completed', $validated)) {
            $validated['completed_at'] = $validated['completed'] ? now() : null;
            unset($validated['completed']);
        }
        $reminder->update($validated);

        return response()->json(['message' => 'Reminder updated.', 'reminder' => $reminder->refresh()]);
    }

    public function destroyReminder(Request $request, PregnancyReminder $reminder): JsonResponse
    {
        $this->ownReminder($request, $reminder)->delete();

        return response()->json(['message' => 'Reminder removed.']);
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
        $reminders = collect();
        $ownPregnancy = $user->pregnancies()->whereIn('status', ['active', 'postpartum'])->latest()->first();
        if ($ownPregnancy) {
            $reminders = $ownPregnancy->reminders()->with('creator:id,name')->get();
        }

        $relationships = Relationship::query()->where('status', 'accepted')
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
            })->get();
        $otherIds = $relationships->map(fn ($relationship) => $relationship->user_one_id === $user->id ? $relationship->user_two_id : $relationship->user_one_id);
        if ($otherIds->isNotEmpty()) {
            $partnerPregnancyIds = Pregnancy::query()->whereIn('user_id', $otherIds)->whereIn('status', ['active', 'postpartum'])->pluck('id');
            $shared = PregnancyReminder::query()->whereIn('pregnancy_id', $partnerPregnancyIds)
                ->where('share_with_partner', true)->with('creator:id,name')->get();
            $reminders = $reminders->concat($shared);
        }

        return response()->json(['reminders' => $reminders->unique('id')->sortBy('remind_at')->values()->map(fn ($reminder) => [
            'id' => $reminder->id, 'title' => $reminder->title, 'category' => $reminder->category,
            'remind_at' => $reminder->remind_at?->toIso8601String(), 'notes' => $reminder->notes,
            'share_with_partner' => (bool) $reminder->share_with_partner, 'completed_at' => $reminder->completed_at?->toIso8601String(),
            'created_by_name' => $reminder->creator?->name,
        ])]);
    }

    public function storeReminder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'category' => ['required', Rule::in(self::REMINDER_CATEGORIES)],
            'remind_at' => ['required', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'share_with_partner' => ['sometimes', 'boolean'],
        ]);
        $user = $request->user();
        $pregnancy = $user->pregnancies()->whereIn('status', ['active', 'postpartum'])->latest()->first();
        $shareWithPartner = (bool) ($validated['share_with_partner'] ?? false);
        if (! $pregnancy) {
            abort_unless($shareWithPartner, 403, 'A reminder for your partner’s pregnancy must be shared with them.');
            $relationships = Relationship::query()->where('status', 'accepted')
                ->where(function ($query) use ($user) {
                    $query->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
                })->get();
            $otherIds = $relationships->map(fn ($relationship) => $relationship->user_one_id === $user->id ? $relationship->user_two_id : $relationship->user_one_id);
            $pregnancy = Pregnancy::query()->whereIn('user_id', $otherIds)->whereIn('status', ['active', 'postpartum'])->latest()->first();
            abort_unless($pregnancy, 404, 'No connected pregnancy journey is available for this reminder.');
        }
        $reminder = $pregnancy->reminders()->create([
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'remind_at' => $validated['remind_at'],
            'notes' => $validated['notes'] ?? null,
            'share_with_partner' => $shareWithPartner,
        ]);

        return response()->json(['message' => $reminder->share_with_partner ? 'Reminder saved and shared with your connected partner.' : 'Reminder saved in your private pregnancy planner.', 'reminder' => $reminder], 201);
    }

    public function updateBabyDetails(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'baby_name' => ['nullable', 'string', 'max:80'],
            'baby_birth_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'baby_birth_time' => ['nullable', 'date_format:H:i'],
            'baby_birth_place' => ['nullable', 'string', 'max:180'],
        ]);
        $pregnancy = $request->user()->pregnancies()->where('status', 'postpartum')->latest()->firstOrFail();
        $pregnancy->update([
            'baby_name' => $validated['baby_name'] ?? null,
            'baby_birth_date' => $validated['baby_birth_date'],
            'baby_birth_time' => $validated['baby_birth_time'] ?? null,
            'baby_birth_place' => $validated['baby_birth_place'] ?? null,
        ]);

        return response()->json(['message' => 'Your baby’s keepsake details have been updated.']);
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
