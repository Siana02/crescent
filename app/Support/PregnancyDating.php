<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Gestational dating for a pregnancy. Gestational age is counted from the estimated due date
 * (EDD = day 280), so every dating method (due date, last period, conception) resolves to the same maths.
 * Weeks are completed weeks ("22 weeks + 4 days"); trimesters follow NHS banding (1: to 13+6, 2: 14-27+6, 3: 28+).
 */
class PregnancyDating
{
    public const TERM_DAYS = 280;

    /** @return array{gestational_days:int,gestational_week:int,gestational_day_in_week:int,trimester:int,days_until_due:int} */
    public static function onDate(CarbonInterface|string $dueDate, CarbonInterface|string $date, ?string $timezone = null): array
    {
        $timezone = $timezone ?: 'UTC';
        $due = CarbonImmutable::parse(self::ymd($dueDate), $timezone)->startOfDay();
        $on = CarbonImmutable::parse(self::ymd($date), $timezone)->startOfDay();
        $daysUntilDue = (int) round($on->diffInDays($due, false));
        $gestationalDays = max(0, self::TERM_DAYS - $daysUntilDue);
        $week = intdiv($gestationalDays, 7);

        return [
            'gestational_days' => $gestationalDays,
            'gestational_week' => $week,
            'gestational_day_in_week' => $gestationalDays % 7,
            'trimester' => $week <= 13 ? 1 : ($week <= 27 ? 2 : 3),
            'days_until_due' => $daysUntilDue,
        ];
    }

    private static function ymd(CarbonInterface|string $value): string
    {
        return $value instanceof CarbonInterface ? $value->format('Y-m-d') : substr($value, 0, 10);
    }
}
