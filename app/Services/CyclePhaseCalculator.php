<?php

namespace App\Services;

use Carbon\CarbonImmutable;

class CyclePhaseCalculator
{
    /**
     * Build the current phase from the latest confirmed period start.
     *
     * Future cycle starts are projections only. They never create period logs.
     *
     * @return array<string, mixed>|null
     */
    public function calculate(
        ?CarbonImmutable $lastConfirmedStart,
        CarbonImmutable $today,
        ?int $cycleLength,
        ?int $periodLength,
        bool $ovulationEstimateAvailable = true,
    ): ?array {
        if (! $lastConfirmedStart || ! $cycleLength || $cycleLength < 18 || $cycleLength > 45) {
            return null;
        }

        $periodLength = max(2, min($periodLength ?: 5, 10));
        $cycleStart = $lastConfirmedStart->startOfDay();
        $today = $today->startOfDay();

        // Move the estimate forward by complete expected cycles when a user
        // returns after an unlogged expected period. Those projected starts
        // remain estimates until the user records an actual period.
        while ($cycleStart->addDays($cycleLength)->lessThanOrEqualTo($today)) {
            $cycleStart = $cycleStart->addDays($cycleLength);
        }

        $cycleStartIsConfirmed = $cycleStart->equalTo($lastConfirmedStart->startOfDay());
        $nextPeriod = $cycleStart->addDays($cycleLength);
        $menstrualEndExclusive = $cycleStart->addDays($periodLength);
        $follicularStart = $menstrualEndExclusive;
        $ovulationDate = $nextPeriod->subDays(14);

        // Keep phase boundaries chronologically valid for shorter cycles.
        if ($ovulationDate->lessThanOrEqualTo($follicularStart)) {
            $ovulationDate = $follicularStart->addDay();
        }

        if (! $ovulationEstimateAvailable) {
            if ($today->lessThan($menstrualEndExclusive)) {
                $phase = 'menstrual';
                $phaseStart = $cycleStart;
                $nextPhase = null;
                $nextPhaseDate = null;
            } else {
                return [
                    'phase' => 'unknown',
                    'cycle_start_date' => $cycleStart->toDateString(),
                    'cycle_start_is_confirmed' => $cycleStartIsConfirmed,
                    'cycle_day' => (int) $cycleStart->diffInDays($today) + 1,
                    'is_estimated' => true,
                    'phase_start_date' => null,
                    'next_phase' => null,
                    'next_phase_date' => null,
                    'expected_period_date' => $cycleStartIsConfirmed ? null : $cycleStart->toDateString(),
                    'next_period_date' => $nextPeriod->toDateString(),
                    'ovulation_date' => null,
                ];
            }
        } elseif ($today->lessThan($menstrualEndExclusive)) {
            $phase = 'menstrual';
            $phaseStart = $cycleStart;
            $nextPhase = 'follicular';
            $nextPhaseDate = $follicularStart;
        } elseif ($today->lessThan($ovulationDate)) {
            $phase = 'follicular';
            $phaseStart = $follicularStart;
            $nextPhase = 'ovulatory';
            $nextPhaseDate = $ovulationDate;
        } elseif ($today->equalTo($ovulationDate)) {
            $phase = 'ovulatory';
            $phaseStart = $ovulationDate;
            $nextPhase = 'luteal';
            $nextPhaseDate = $ovulationDate->addDay();
        } else {
            $phase = 'luteal';
            $phaseStart = $ovulationDate->addDay();
            $nextPhase = 'menstrual';
            $nextPhaseDate = $nextPeriod;
        }

        $cycleDay = (int) $cycleStart->diffInDays($today) + 1;

        return [
            'phase' => $phase,
            'cycle_start_date' => $cycleStart->toDateString(),
            'cycle_start_is_confirmed' => $cycleStartIsConfirmed,
            'cycle_day' => $cycleDay,
            'is_estimated' => ! $cycleStartIsConfirmed || $phase !== 'menstrual',
            'phase_start_date' => $phaseStart->toDateString(),
            'next_phase' => $nextPhase,
            'next_phase_date' => $nextPhaseDate?->toDateString(),
            'expected_period_date' => $cycleStartIsConfirmed ? null : $cycleStart->toDateString(),
            'next_period_date' => $nextPeriod->toDateString(),
            'ovulation_date' => $ovulationEstimateAvailable ? $ovulationDate->toDateString() : null,
        ];
    }
}
