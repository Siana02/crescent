<?php

namespace Tests\Unit;

use App\Support\PregnancyDating;
use PHPUnit\Framework\TestCase;

class PregnancyDatingTest extends TestCase
{
    public function test_week_and_day_boundaries(): void
    {
        // Due 2026-12-01 => day 280. Day 0 is 2026-02-24.
        $cases = [
            ['2026-02-24', 0, 0, 0, 1],
            ['2026-03-02', 6, 0, 6, 1],
            ['2026-03-03', 7, 1, 0, 1],
            ['2026-05-26', 91, 13, 0, 1],
            ['2026-06-01', 97, 13, 6, 1],
            ['2026-06-02', 98, 14, 0, 2],
            ['2026-09-07', 195, 27, 6, 2],
            ['2026-09-08', 196, 28, 0, 3],
            ['2026-12-01', 280, 40, 0, 3],
        ];
        foreach ($cases as [$date, $days, $week, $day, $trimester]) {
            $r = PregnancyDating::onDate('2026-12-01', $date, 'UTC');
            $this->assertSame($days, $r['gestational_days'], $date);
            $this->assertSame($week, $r['gestational_week'], $date);
            $this->assertSame($day, $r['gestational_day_in_week'], $date);
            $this->assertSame($trimester, $r['trimester'], $date);
            $this->assertSame(280 - $days, $r['days_until_due'], $date);
        }
    }

    public function test_154_days_is_22_weeks_and_0_days(): void
    {
        $r = PregnancyDating::onDate('2026-12-01', '2026-07-28', 'UTC');
        $this->assertSame([154, 22, 0, 2], [$r['gestational_days'], $r['gestational_week'], $r['gestational_day_in_week'], $r['trimester']]);
    }

    public function test_after_due_date_has_negative_days_until_due(): void
    {
        $r = PregnancyDating::onDate('2026-12-01', '2026-12-05', 'UTC');
        $this->assertSame(284, $r['gestational_days']);
        $this->assertSame(-4, $r['days_until_due']);
    }
}
