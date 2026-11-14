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

        // A newly logged start changes the basis for every pending phase
        // welcome. The dashboard will mark the matching logged phase as settled.
        CyclePhasePresentation::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->update(['status' => 'superseded', 'responded_at' => now()]);

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

        $previousStart = $period->start_date->format('Y-m-d');
        $updatedPeriod = DB::transaction(function () use ($request, $period, $validated, $previousStart) {
            $duplicate = $request->user()->periodLogs()
                ->whereDate('start_date', $validated['start_date'])
                ->where('id', '!=', $period->id)
                ->lockForUpdate()
                ->first();

            if ($duplicate) {
                // A corrected start can coincide with a separately logged
                // start (for example, the first bleeding day was logged twice).
                // Consolidate the records so the corrected period has one
                // start and retains its end date and user-entered details.
                $endDates = collect([
                    $duplicate->end_date?->format('Y-m-d'),
                    $period->end_date?->format('Y-m-d'),
                    $validated['end_date'] ?? null,
                ])->filter()->sort()->values();
                $notes = collect([$duplicate->notes, $period->notes, $validated['notes'] ?? null])
                    ->filter(fn ($note) => filled($note))
                    ->unique()
                    ->implode("\n");

                $duplicate->update([
                    'end_date' => $endDates->last(),
                    'flow_intensity' => $validated['flow_intensity'] ?? $duplicate->flow_intensity ?? $period->flow_intensity,
                    'notes' => $notes !== '' ? $notes : null,
                ]);
                $period->delete();
                $canonicalPeriod = $duplicate->fresh();

                $profile = $request->user()->cycleProfile;
                if ($profile?->cycle_tracking_started_at && in_array($profile->cycle_tracking_started_at->format('Y-m-d'), [$previousStart, $validated['start_date']], true)) {
                    $profile->update(['cycle_tracking_started_at' => $validated['start_date']]);
                }

                CyclePhasePresentation::query()
                    ->where('user_id', $request->user()->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'superseded', 'responded_at' => now()]);

                return $canonicalPeriod;
            }

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

            return $period->fresh();
        });

        return response()->json([
            'period' => [
                'id' => $updatedPeriod->id,
                'start_date' => $updatedPeriod->start_date->format('Y-m-d'),
                'end_date' => $updatedPeriod->end_date?->format('Y-m-d'),
                'flow_intensity' => $updatedPeriod->flow_intensity,
            ],
            'recalculated' => true,
        ]);
    }
}
