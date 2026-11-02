<?php

namespace App\Http\Controllers;

use App\Models\CyclePhasePresentation;
use App\Models\PeriodLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CyclePhasePresentationController extends Controller
{
    public function respond(Request $request, CyclePhasePresentation $presentation): JsonResponse
    {
        abort_unless($presentation->user_id === $request->user()->id, 404);
        abort_unless($presentation->status === 'pending', 409);

        $timezone = $request->user()->cycleProfile()->value('timezone') ?? config('app.timezone', 'UTC');
        $today = now($timezone)->toDateString();
        $validated = $request->validate([
            'action' => ['required', Rule::in(['confirm', 'dismiss'])],
            'start_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:'.$today],
        ]);

        $periodStartDate = $validated['start_date'] ?? $presentation->phase_start_date->format('Y-m-d');
        if ($validated['action'] === 'confirm' && $presentation->phase === 'menstrual') {
            $period = PeriodLog::query()->firstOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'start_date' => $periodStartDate,
                ],
                [
                    'end_date' => null,
                    'flow_intensity' => null,
                ],
            );

            if ($period->wasRecentlyCreated) {
                try {
                    app(\App\Services\CrescentPushService::class)->notifyPartners(
                        $request->user(),
                        'partner_menstruating',
                        'cycle_details',
                        'crescent:partner-period-start:'.$request->user()->id.':'.$periodStartDate,
                        60 * 24 * 30,
                    );
                } catch (\Throwable $exception) {
                    report($exception);
                }
            }
        }

        $presentation->update([
            'status' => $validated['action'] === 'confirm' ? 'acknowledged' : 'dismissed',
            'responded_at' => now(),
        ]);

        return response()->json([
            'presentation' => [
                'id' => $presentation->id,
                'phase' => $presentation->phase,
                'status' => $presentation->status,
            ],
            'period_recorded' => $validated['action'] === 'confirm' && $presentation->phase === 'menstrual',
        ]);
    }
}
