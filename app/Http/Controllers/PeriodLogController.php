<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $timezone = $request->user()->cycleProfile()->value('timezone') ?? config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone)->toDateString();

        $validated = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d', "before_or_equal:$today"],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date', "before_or_equal:$today"],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $period = $request->user()->periodLogs()->updateOrCreate(
            ['start_date' => $validated['start_date']],
            [
                'end_date' => $validated['end_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        // A period logged soon after returning from postpartum can have started
        // shortly before the user switched journeys. Keep older pregnancy-era
        // history out of the current-cycle overview while allowing recent logs.
        $profile = $request->user()->cycleProfile;
        if ($profile?->active_journey === 'cycle' && $profile->cycle_tracking_started_at) {
            $loggedStart = CarbonImmutable::parse($validated['start_date'], $timezone);
            $trackingStart = CarbonImmutable::parse($profile->cycle_tracking_started_at->format('Y-m-d'), $timezone);
            if ($loggedStart->greaterThanOrEqualTo(CarbonImmutable::today($timezone)->subDays(60)) && $loggedStart->lessThan($trackingStart)) {
                $profile->update(['cycle_tracking_started_at' => $validated['start_date']]);
            }
        }

        return response()->json([
            'period' => [
                'start_date' => $period->start_date->format('Y-m-d'),
                'end_date' => $period->end_date?->format('Y-m-d'),
            ],
        ], 201);
    }
}
