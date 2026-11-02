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

        $validated = $request->validate([
            'action' => ['required', Rule::in(['confirm', 'dismiss'])],
        ]);

        if ($validated['action'] === 'confirm' && $presentation->phase === 'menstrual') {
            PeriodLog::query()->updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'start_date' => $presentation->cycle_start_date->format('Y-m-d'),
                ],
                [
                    'end_date' => null,
                    'flow_intensity' => null,
                ],
            );
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
