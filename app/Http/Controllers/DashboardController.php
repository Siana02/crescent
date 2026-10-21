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
        $estimatedNext = ($lastStart && $profile->average_cycle_length)
            ? $lastStart->addDays($profile->average_cycle_length)
            : null;
        $cycleDay = $lastStart ? ((int) $lastStart->diffInDays($today) + 1) : null;
        $daysUntilEstimate = null;

        if ($estimatedNext) {
            $daysUntilEstimate = $estimatedNext->lessThan($today)
                ? -1 * (int) $estimatedNext->diffInDays($today)
                : (int) $today->diffInDays($estimatedNext);
        }

        $todayCheckin = $user->dailyCheckins()->whereDate('log_date', $today->toDateString())->first();

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
            ],
            'latest_period' => $latestPeriod ? [
                'start_date' => $latestPeriod->start_date->format('Y-m-d'),
                'end_date' => $latestPeriod->end_date?->format('Y-m-d'),
            ] : null,
            'cycle_day' => $cycleDay,
            'estimated_next_period' => $estimatedNext?->toDateString(),
            'days_until_estimate' => $daysUntilEstimate,
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
