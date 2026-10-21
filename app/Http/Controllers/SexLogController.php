<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SexLogController extends Controller
{
    private const ACTIVITIES = [
        'vaginal', 'anal', 'oral_giving', 'oral_receiving', 'manual_partner',
        'mutual_masturbation', 'masturbation', 'kissing_touching', 'toys', 'other',
    ];

    private const PROTECTION_METHODS = [
        'condom_external', 'condom_internal', 'pill', 'iud', 'implant', 'injection',
        'patch_ring', 'withdrawal', 'fertility_awareness', 'none', 'other',
    ];

    public function store(Request $request): JsonResponse
    {
        $profile = $request->user()->cycleProfile()->firstOrCreate([]);
        $today = CarbonImmutable::today($profile->timezone ?: 'UTC')->toDateString();

        $validated = $request->validate([
            'log_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'activities' => ['sometimes', 'array', 'max:10'],
            'activities.*' => ['string', Rule::in(self::ACTIVITIES)],
            'protection_methods' => ['sometimes', 'array', 'max:11'],
            'protection_methods.*' => ['string', Rule::in(self::PROTECTION_METHODS)],
            'sex_drive' => ['nullable', 'integer', 'between:1,5'],
            'orgasm' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $log = $request->user()->sexLogs()->create([
            'log_date' => $validated['log_date'] ?? $today,
            'activities' => $validated['activities'] ?? [],
            'protection_methods' => $validated['protection_methods'] ?? [],
            'sex_drive' => $validated['sex_drive'] ?? null,
            'orgasm' => $validated['orgasm'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Your private sexual-wellbeing log has been saved.',
            'log' => [
                'id' => $log->id,
                'log_date' => $log->log_date->format('Y-m-d'),
                'activities' => $log->activities ?? [],
                'protection_methods' => $log->protection_methods ?? [],
                'sex_drive' => $log->sex_drive,
                'orgasm' => $log->orgasm,
                'notes' => $log->notes,
            ],
        ], 201);
    }
}
