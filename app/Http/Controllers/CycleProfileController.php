<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CycleProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'average_cycle_length' => ['nullable', 'integer', 'between:21,45'],
            'average_period_length' => ['nullable', 'integer', 'between:1,10'],
            'cycle_regularity' => ['required', 'in:regular,irregular,unknown'],
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        $profile = $request->user()->cycleProfile()->updateOrCreate([], $validated);

        return response()->json([
            'profile' => [
                'average_cycle_length' => $profile->average_cycle_length,
                'average_period_length' => $profile->average_period_length,
                'cycle_regularity' => $profile->cycle_regularity,
                'timezone' => $profile->timezone,
            ],
        ]);
    }
}
