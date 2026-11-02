<?php

namespace App\Http\Controllers;

use App\Models\CyclePhasePresentation;
use App\Models\PeriodLog;
use App\Services\CrescentPushService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

class PeriodLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user()->cycleProfile;
        $periods = $request->user()->periodLogs();

        if ($profile?->cycle_tracking_started_at) {
            $periods->whereDate('start_date', '>=', $profile->cycle_tracking_started_at->format('Y-m-d'));
        }

        return response()->json([
            'periods' => $periods->orderByDesc('start_date')->get()->map(fn ($period) => [
                'id' => $period->id,
                'start_date' => $period->start_date->format('Y-m-d'),
                'end_date' => $period->end_date?->format('Y-m-d'),
                'flow_intensity' => $period->flow_intensity,
            ])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $timezone = $request->user()->cycleProfile()->value('timezone') ?? config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone)->toDateString();

        $validated = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d', "before_or_equal:$today"],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date', "before_or_equal:$today"],
            'flow_intensity' => ['nullable', Rule::in(['spotting', 'light', 'medium', 'heavy', 'other'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $existingPeriod = $request->user()->periodLogs()->whereDate('start_date', $validated['start_date'])->first();
        $isNewPeriodStart = $existingPeriod === null;
        $isNewPeriodEnd = $existingPeriod !== null && $existingPeriod->end_date === null && ! empty($validated['end_date']);

        $period = $request->user()->periodLogs()->updateOrCreate(
            ['start_date' => $validated['start_date']],
            [
                'end_date' => $validated['end_date'] ?? null,
                'flow_intensity' => $validated['flow_intensity'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        CyclePhasePresentation::query()
            ->where('user_id', $request->user()->id)
            ->where('phase', 'menstrual')
            ->where('status', 'pending')
            ->whereDate('cycle_start_date', '<=', CarbonImmutable::parse($validated['start_date'], $timezone)->addDays(10)->toDateString())
            ->update(['status' => 'acknowledged', 'responded_at' => now()]);

        $profile = $request->user()->cycleProfile;
        if ($profile?->active_journey === 'cycle' && $profile->cycle_tracking_started_at) {
            $loggedStart = CarbonImmutable::parse($validated['start_date'], $timezone);
            $trackingStart = CarbonImmutable::parse($profile->cycle_tracking_started_at->format('Y-m-d'), $timezone);
            if ($loggedStart->greaterThanOrEqualTo(CarbonImmutable::today($timezone)->subDays(60)) && $loggedStart->lessThan($trackingStart)) {
                $profile->update(['cycle_tracking_started_at' => $validated['start_date']]);
            }
        }

        try {
            $push = app(CrescentPushService::class);
            if ($isNewPeriodStart) {
                $push->notifyPartners($request->user(), 'partner_menstruating', 'cycle_details', 'crescent:partner-period-start:'.$request->user()->id.':'.$validated['start_date'], 60 * 24 * 30);
            }
            if ($isNewPeriodEnd) {
                $push->notifyPartners($request->user(), 'partner_period_ended', 'cycle_details', 'crescent:partner-period-end:'.$request->user()->id.':'.$validated['start_date'], 60 * 24 * 30);
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json([
            'period' => [
                'start_date' => $period->start_date->format('Y-m-d'),
                'end_date' => $period->end_date?->format('Y-m-d'),
                'flow_intensity' => $period->flow_intensity,
            ],
        ], 201);
    }

    public function update(Request $request, PeriodLog $period): JsonResponse
    {
        abort_unless($period->user_id === $request->user()->id, 404);

        $timezone = $request->user()->cycleProfile()->value('timezone') ?? config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone)->toDateString();
        $validated = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d', "before_or_equal:$today"],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date', "before_or_equal:$today"],
            'flow_intensity' => ['nullable', Rule::in(['spotting', 'light', 'medium', 'heavy', 'other'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $duplicate = $request->user()->periodLogs()
            ->whereDate('start_date', $validated['start_date'])
            ->where('id', '!=', $period->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'A period already starts on that date. Edit that record instead of creating a duplicate.',
            ], 422);
        }

        $previousStart = $period->start_date->format('Y-m-d');

        DB::transaction(function () use ($request, $period, $validated, $previousStart) {
            $period->update([
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'flow_intensity' => $validated['flow_intensity'] ?? $period->flow_intensity,
                'notes' => $validated['notes'] ?? $period->notes,
            ]);

            $profile = $request->user()->cycleProfile;
            if ($profile?->cycle_tracking_started_at?->format('Y-m-d') === $previousStart) {
                $profile->update(['cycle_tracking_started_at' => $validated['start_date']]);
            }

            CyclePhasePresentation::query()
                ->where('user_id', $request->user()->id)
                ->where('status', 'pending')
                ->update(['status' => 'superseded', 'responded_at' => now()]);
        });

        return response()->json([
            'period' => [
                'id' => $period->id,
                'start_date' => $period->start_date->format('Y-m-d'),
                'end_date' => $period->end_date?->format('Y-m-d'),
                'flow_intensity' => $period->flow_intensity,
            ],
            'recalculated' => true,
        ]);
    }
}
