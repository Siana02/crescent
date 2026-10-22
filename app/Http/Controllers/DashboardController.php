<?php

namespace App\Http\Controllers;

use App\Models\Relationship;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate(['timezone' => ['sometimes', 'string', 'timezone']]);
        $user = $request->user();
        $profile = $user->cycleProfile()->firstOrCreate([], [
            'timezone' => $validated['timezone'] ?? config('app.timezone', 'UTC'),
        ]);

        if (isset($validated['timezone']) && $profile->timezone !== $validated['timezone']) {
            $profile->update(['timezone' => $validated['timezone']]);
        }

        $activeJourney = $profile->active_journey ?? 'cycle';
        $isPregnancyJourney = in_array($activeJourney, ['pregnancy', 'postpartum'], true);
        $isPostpartumJourney = $activeJourney === 'postpartum';
        $periodQuery = $user->periodLogs();
        if ($profile->cycle_tracking_started_at) {
            $periodQuery->whereDate('start_date', '>=', $profile->cycle_tracking_started_at->format('Y-m-d'));
        }
        $latestPeriod = $isPregnancyJourney ? null : $periodQuery->orderByDesc('start_date')->first();
        $today = CarbonImmutable::today($profile->timezone);
        $lastStart = $latestPeriod
            ? CarbonImmutable::parse($latestPeriod->start_date->format('Y-m-d'), $profile->timezone)->startOfDay()
            : null;
        $periodHistory = $isPregnancyJourney ? collect() : (clone $periodQuery)
            ->reorder('start_date')
            ->whereDate('start_date', '>=', $today->subMonths(6)->toDateString())
            ->get()
            ->map(fn ($period) => [
                'start_date' => $period->start_date->format('Y-m-d'),
                'end_date' => $period->end_date?->format('Y-m-d'),
                'flow_intensity' => $period->flow_intensity,
            ])
            ->values();
        $usesHormonalContraception = in_array($profile->contraception_type, ['pill', 'hormonal_iud', 'implant', 'injection', 'patch', 'ring'], true);
        $estimatedNext = ($lastStart && $profile->average_cycle_length && ! $usesHormonalContraception)
            ? $lastStart->addDays($profile->average_cycle_length)
            : null;
        $fertilityWindow = null;

        if ($estimatedNext && $profile->contraception_type === 'none' && $profile->cycle_regularity !== 'irregular') {
            $estimatedOvulation = $estimatedNext->subDays(14);
            $fertilityWindow = [
                'ovulation_date' => $estimatedOvulation->toDateString(),
                'start_date' => $estimatedOvulation->subDays(5)->toDateString(),
                'end_date' => $estimatedOvulation->addDay()->toDateString(),
            ];
        }
        $cycleDay = $lastStart ? ((int) $lastStart->diffInDays($today) + 1) : null;
        $daysUntilEstimate = null;

        if ($estimatedNext) {
            $daysUntilEstimate = $estimatedNext->lessThan($today)
                ? -1 * (int) $estimatedNext->diffInDays($today)
                : (int) $today->diffInDays($estimatedNext);
        }

        $todayCheckin = $isPregnancyJourney ? null : $user->dailyCheckins()->whereDate('log_date', $today->toDateString())->first();
        $pregnancy = $isPregnancyJourney ? $user->pregnancies()->where('status', $isPostpartumJourney ? 'postpartum' : 'active')->latest()->first() : null;
        $pregnancySummary = null;

        if ($pregnancy) {
            $dueDate = CarbonImmutable::parse($pregnancy->due_date->format('Y-m-d'), $profile->timezone)->startOfDay();
            $daysUntilDue = $today->diffInDays($dueDate, false);
            $gestationalDays = max(0, 280 - $daysUntilDue);
            $gestationalWeek = max(1, (int) floor($gestationalDays / 7));
            $trimester = $gestationalWeek <= 13 ? 1 : ($gestationalWeek <= 27 ? 2 : 3);
            $todayPregnancyCheckin = $isPostpartumJourney ? null : $pregnancy->checkins()->whereDate('log_date', $today->toDateString())->first();
            $postpartumLogsToday = $isPostpartumJourney ? $pregnancy->postpartumLogs()->whereDate('log_date', $today->toDateString())->latest()->get()->map(fn ($log) => ['id' => $log->id, 'log_date' => $log->log_date->format('Y-m-d'), 'category' => $log->category, 'notes' => $log->notes])->values() : collect();

            $pregnancySummary = [
                'due_date' => $pregnancy->due_date->format('Y-m-d'),
                'last_period_date' => $pregnancy->last_period_date?->format('Y-m-d'),
                'conception_date' => $pregnancy->conception_date?->format('Y-m-d'),
                'due_date_source' => $pregnancy->due_date_source,
                'wants_baby_astrology' => (bool) $pregnancy->wants_baby_astrology,
                'status' => $pregnancy->status,
                'gestational_week' => $gestationalWeek,
                'gestational_day_in_week' => $gestationalDays % 7,
                'gestational_days' => $gestationalDays,
                'trimester' => $trimester,
                'days_until_due' => $daysUntilDue,
                'postpartum_logs_today' => $postpartumLogsToday,
                'today_checkin' => $todayPregnancyCheckin ? [
                    'log_date' => $todayPregnancyCheckin->log_date->format('Y-m-d'),
                    'symptoms' => $todayPregnancyCheckin->symptoms ?? [],
                    'mood' => $todayPregnancyCheckin->mood,
                    'energy_level' => $todayPregnancyCheckin->energy_level,
                    'notes' => $todayPregnancyCheckin->notes,
                ] : null,
            ];
        }
        $relationships = Relationship::with(['initiator.cycleProfile', 'companion.cycleProfile'])
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
            })
            ->latest()
            ->get()
            ->map(function (Relationship $relationship) use ($user) {
                $isInitiator = $relationship->user_one_id === $user->id;
                $companion = $isInitiator ? $relationship->companion : $relationship->initiator;
                $allPreferences = $relationship->sharing_preferences ?? [];
                $defaults = ['cycle_details' => false, 'pregnancy_details' => false, 'wellbeing_updates' => false, 'astrology' => false];
                $myPreferences = array_merge($defaults, $allPreferences[(string) $user->id] ?? []);
                $companionPreferences = array_merge($defaults, $allPreferences[(string) ($companion?->id ?? 0)] ?? []);
                // Older connections used one shared flat preference object; preserve it as a conservative fallback.
                if (! array_key_exists((string) ($companion?->id ?? 0), $allPreferences) && array_key_exists('cycle_details', $allPreferences)) {
                    $companionPreferences = array_merge($defaults, $allPreferences);
                }
                $companionProfile = $companion?->cycleProfile;
                $companionJourney = $companionProfile?->active_journey ?? 'cycle';
                $journeyIsShared = $companionJourney === 'pregnancy' || $companionJourney === 'postpartum'
                    ? $companionPreferences['pregnancy_details']
                    : $companionPreferences['cycle_details'];

                return [
                    'id' => $relationship->id,
                    'relationship_type' => $relationship->relationship_type,
                    'status' => $relationship->status,
                    'invite_code' => $isInitiator && $relationship->status === 'pending' ? $relationship->invite_code : null,
                    'companion_name' => $relationship->status === 'accepted'
                        ? ($companionProfile?->display_name ?: $companion?->name)
                        : null,
                    'companion_journey' => $journeyIsShared ? $companionJourney : null,
                    'companion_goal' => $journeyIsShared ? $companionProfile?->primary_goal : null,
                    'companion_sun_sign' => $companionPreferences['astrology'] ? $companionProfile?->sun_sign : null,
                    'companion_moon_sign' => $companionPreferences['astrology'] ? $companionProfile?->moon_sign : null,
                    'companion_rising_sign' => $companionPreferences['astrology'] ? $companionProfile?->rising_sign : null,
                    'sharing_preferences' => $myPreferences,
                    'companion_sharing_preferences' => $companionPreferences,
                    'sharing_enabled' => (bool) ($companionPreferences['cycle_details'] || $companionPreferences['pregnancy_details']),
                ];
            })
            ->values();

        return response()->json([
            'user' => ['name' => $user->name, 'email' => $user->email],
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
                'active_journey' => $profile->active_journey ?? 'cycle',
                'cycle_tracking_started_at' => $profile->cycle_tracking_started_at?->format('Y-m-d'),
            ],
            'latest_period' => $latestPeriod ? [
                'start_date' => $latestPeriod->start_date->format('Y-m-d'),
                'end_date' => $latestPeriod->end_date?->format('Y-m-d'),
                'flow_intensity' => $latestPeriod->flow_intensity,
            ] : null,
            'period_history' => $periodHistory,
            'cycle_day' => $cycleDay,
            'estimated_next_period' => $estimatedNext?->toDateString(),
            'days_until_estimate' => $daysUntilEstimate,
            'fertility_window' => $fertilityWindow,
            'relationships' => $relationships,
            'pregnancy' => $pregnancySummary,
            'today_checkin' => $todayCheckin ? [
                'log_date' => $todayCheckin->log_date->format('Y-m-d'),
                'energy_level' => $todayCheckin->energy_level,
                'mood' => $todayCheckin->mood ? explode(',', $todayCheckin->mood) : [],
                'symptoms' => $todayCheckin->symptoms ?? [],
                'notes' => $todayCheckin->notes,
            ] : null,
        ]);
    }
}
