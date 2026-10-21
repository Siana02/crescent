<?php

namespace App\Http\Controllers;

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

        $latestPeriod = $user->periodLogs()->orderByDesc('start_date')->first();
        $today = CarbonImmutable::today($profile->timezone);
        $lastStart = $latestPeriod
            ? CarbonImmutable::parse($latestPeriod->start_date->format('Y-m-d'), $profile->timezone)->startOfDay()
            : null;
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

        $todayCheckin = $user->dailyCheckins()->whereDate('log_date', $today->toDateString())->first();
        $relationships = Relationship::with(['initiator.cycleProfile', 'companion.cycleProfile'])
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
            })
            ->latest()
            ->get()
            ->map(function (Relationship $relationship) use ($user) {
                $isInitiator = $relationship->user_one_id === $user->id;
                $companion = $isInitiator ? $relationship->companion : $relationship->initiator;

                return [
                    'id' => $relationship->id,
                    'relationship_type' => $relationship->relationship_type,
                    'status' => $relationship->status,
                    'invite_code' => $isInitiator && $relationship->status === 'pending' ? $relationship->invite_code : null,
                    'companion_name' => $relationship->status === 'accepted'
                        ? ($companion?->cycleProfile?->display_name ?: $companion?->name)
                        : null,
                    'sharing_enabled' => (bool) ($relationship->sharing_preferences['cycle_details'] ?? false),
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
            ],
            'latest_period' => $latestPeriod ? [
                'start_date' => $latestPeriod->start_date->format('Y-m-d'),
                'end_date' => $latestPeriod->end_date?->format('Y-m-d'),
            ] : null,
            'cycle_day' => $cycleDay,
            'estimated_next_period' => $estimatedNext?->toDateString(),
            'days_until_estimate' => $daysUntilEstimate,
            'fertility_window' => $fertilityWindow,
            'relationships' => $relationships,
            'today_checkin' => $todayCheckin ? [
                'log_date' => $todayCheckin->log_date->format('Y-m-d'),
                'energy_level' => $todayCheckin->energy_level,
                'mood' => $todayCheckin->mood,
                'symptoms' => $todayCheckin->symptoms ?? [],
                'notes' => $todayCheckin->notes,
            ] : null,
        ]);
    }
}
