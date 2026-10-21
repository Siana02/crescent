<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CycleProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'average_cycle_length' => ['required', 'integer', 'between:21,45'],
            'average_period_length' => ['required', 'integer', 'between:1,10'],
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        $profile = $request->user()->cycleProfile()->updateOrCreate([], $validated);

        return response()->json([
            'profile' => [
                'average_cycle_length' => $profile->average_cycle_length,
                'average_period_length' => $profile->average_period_length,
                'timezone' => $profile->timezone,
            ],
        ]);
    }
}
