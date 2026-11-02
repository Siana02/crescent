<?php

namespace Tests\Unit;

use App\Services\CyclePhaseCalculator;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class CyclePhaseCalculatorTest extends TestCase
{
    public function test_it_calculates_the_four_phase_boundaries_from_a_confirmed_start(): void
    {
        $calculator = new CyclePhaseCalculator();
        $start = CarbonImmutable::parse('2026-10-01', 'Africa/Nairobi');

        $menstrual = $calculator->calculate($start, CarbonImmutable::parse('2026-10-03', 'Africa/Nairobi'), 28, 5);
        $follicular = $calculator->calculate($start, CarbonImmutable::parse('2026-10-08', 'Africa/Nairobi'), 28, 5);
        $ovulatory = $calculator->calculate($start, CarbonImmutable::parse('2026-10-15', 'Africa/Nairobi'), 28, 5);
        $luteal = $calculator->calculate($start, CarbonImmutable::parse('2026-10-16', 'Africa/Nairobi'), 28, 5);

        $this->assertSame('menstrual', $menstrual['phase']);
        $this->assertSame('follicular', $follicular['phase']);
        $this->assertSame('ovulatory', $ovulatory['phase']);
        $this->assertSame('luteal', $luteal['phase']);
        $this->assertSame('2026-10-15', $ovulatory['phase_start_date']);
        $this->assertSame('2026-10-16', $luteal['phase_start_date']);
    }

    public function test_it_projects_a_new_cycle_after_a_missed_expected_period_without_claiming_it_was_logged(): void
    {
        $calculator = new CyclePhaseCalculator();
        $result = $calculator->calculate(
            CarbonImmutable::parse('2026-10-01'),
            CarbonImmutable::parse('2026-11-14'),
            28,
            5,
        );

        $this->assertSame('2026-10-29', $result['cycle_start_date']);
        $this->assertFalse($result['cycle_start_is_confirmed']);
        $this->assertSame('luteal', $result['phase']);
        $this->assertSame('2026-10-29', $result['expected_period_date']);
        $this->assertTrue($result['is_estimated']);
    }

    public function test_it_does_not_predict_ovulation_when_the_cycle_method_makes_that_estimate_unavailable(): void
    {
        $calculator = new CyclePhaseCalculator();
        $result = $calculator->calculate(
            CarbonImmutable::parse('2026-10-01'),
            CarbonImmutable::parse('2026-10-12'),
            28,
            5,
            false,
        );

        $this->assertSame('unknown', $result['phase']);
        $this->assertNull($result['ovulation_date']);
        $this->assertNull($result['next_phase']);
    }
}
