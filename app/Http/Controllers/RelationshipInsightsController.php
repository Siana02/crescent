<?php

namespace App\Http\Controllers;

use App\Models\CosmicCompatibility;
use App\Models\Relationship;
use App\Models\CycleProfile;
use App\Models\User;
use App\Support\AstroInterpreter;
use App\Support\RelationshipReflections;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RelationshipInsightsController extends Controller
{
    private const ELEMENTS = [
        'Aries' => 'fire', 'Leo' => 'fire', 'Sagittarius' => 'fire',
        'Taurus' => 'earth', 'Virgo' => 'earth', 'Capricorn' => 'earth',
        'Gemini' => 'air', 'Libra' => 'air', 'Aquarius' => 'air',
        'Cancer' => 'water', 'Scorpio' => 'water', 'Pisces' => 'water',
    ];

    private function ensureParticipant(Relationship $relationship, Request $request): void
    {
        abort_unless(
            $relationship->status === 'accepted'
            && in_array($request->user()->id, [$relationship->user_one_id, $relationship->user_two_id], true),
            404
        );
    }

    private function profileFor(Relationship $relationship, int $userId): ?CycleProfile
    {
        $otherId = $relationship->user_one_id === $userId ? $relationship->user_two_id : $relationship->user_one_id;
        return CycleProfile::whereIn('user_id', [$userId, $otherId])->get()->keyBy('user_id')->get($userId);
    }

    private function signTone(?string $left, ?string $right, string $label = 'Sun signs'): ?array
    {
        if (! $left || ! $right) return null;
        return AstroInterpreter::signTheme($label, $left, $right);
    }

    private function skySnapshot(): array
    {
        return Cache::remember('crescent:relationship-sky:'.now('UTC')->format('Y-m-d'), now('UTC')->endOfDay(), function () {
            $response = app(AstrologyController::class)->sky();
            $data = $response->getData(true);
            if ($response->getStatusCode() !== 200 || ! is_array($data['placements'] ?? null)) return [];
            return array_values(array_map(
                fn (array $placement) => ['name' => $placement['name'] ?? 'Planet', 'sign' => $placement['sign'] ?? null, 'degree' => $placement['degree'] ?? null],
                $data['placements']
            ));
        });
    }

    private function chartForProfile(?CycleProfile $profile): array
    {
        if (! $profile?->birth_date || ! $profile?->birth_place) return ['placements' => [], 'birth_time_known' => false];

        $key = 'crescent:relationship-natal:'.hash('sha256', implode('|', [
            $profile->birth_date->format('Y-m-d'),
            $profile->birth_time ?? 'unknown-time',
            mb_strtolower(trim($profile->birth_place)),
        ]));

        return Cache::remember($key, now()->addDays(7), function () use ($profile) {
            $chartRequest = Request::create('/api/astrology/chart', 'GET');
            $chartRequest->setUserResolver(fn () => (object) ['cycleProfile' => $profile]);
            $response = app(AstrologyController::class)->chart($chartRequest);
            $data = $response->getData(true);
            return $response->getStatusCode() === 200
                ? ['placements' => $data['placements'] ?? [], 'birth_time_known' => (bool) ($data['birth_time_known'] ?? false)]
                : ['placements' => [], 'birth_time_known' => false];
        });
    }

    private function absoluteLongitude(array $placement): ?float
    {
        $signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        $sign = array_search($placement['sign'] ?? null, $signs, true);
        $degree = $placement['degree'] ?? null;
        if ($sign === false || ! is_numeric($degree)) return null;
        return $sign * 30 + (float) $degree;
    }

    private function chartSign(array $placements, string $target): ?string
    {
        foreach ($placements as $placement) {
            $name = strtolower((string) ($placement['name'] ?? ''));
            $matches = $target === 'rising'
                ? (str_contains($name, 'ascendant') || $name === 'rising' || $name === 'asc')
                : str_contains($name, $target);
            if ($matches && ! empty($placement['sign'])) {
                return (string) $placement['sign'];
            }
        }

        return null;
    }

    private function aspects(array $first, array $second, bool $firstTimeKnown = true, bool $secondTimeKnown = true, bool $transitMode = false): array
    {
        $rules = [
            ['name' => 'Conjunction', 'angle' => 0, 'orb' => 6],
            ['name' => 'Sextile', 'angle' => 60, 'orb' => 4],
            ['name' => 'Square', 'angle' => 90, 'orb' => 5],
            ['name' => 'Trine', 'angle' => 120, 'orb' => 5],
            ['name' => 'Opposition', 'angle' => 180, 'orb' => 6],
        ];
        $allowed = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
        $found = [];
        foreach ($first as $left) {
            if (! in_array($left['name'] ?? '', $allowed, true)) continue;
            if (! $firstTimeKnown && ($left['name'] ?? '') === 'Moon') continue;
            $leftLongitude = $this->absoluteLongitude($left);
            if ($leftLongitude === null) continue;
            foreach ($second as $right) {
                if (! in_array($right['name'] ?? '', $allowed, true)) continue;
                if (! $secondTimeKnown && ($right['name'] ?? '') === 'Moon') continue;
                $rightLongitude = $this->absoluteLongitude($right);
                if ($rightLongitude === null) continue;
                $separation = abs($leftLongitude - $rightLongitude);
                if ($separation > 180) $separation = 360 - $separation;
                $matches = array_values(array_filter(array_map(function (array $rule) use ($separation) {
                    $distance = abs($separation - $rule['angle']);
                    return ['name' => $rule['name'], 'orb' => round($distance, 1), 'limit' => $rule['orb']];
                }, $rules), fn (array $rule) => $rule['orb'] <= $rule['limit']));
                usort($matches, fn (array $a, array $b) => $a['orb'] <=> $b['orb']);
                if (! $matches) continue;
                $aspect = $matches[0];
                $supportive = in_array($aspect['name'], ['Trine', 'Sextile'], true);
                $found[] = [
                    'left' => $left['name'],
                    'right' => $right['name'],
                    'aspect' => $aspect['name'],
                    'orb' => $aspect['orb'],
                    'tone' => $supportive ? 'supportive' : (in_array($aspect['name'], ['Square', 'Opposition'], true) ? 'growth' : 'intense'),
                    'text' => AstroInterpreter::aspect($left['name'], $right['name'], $aspect['name'], (float) $aspect['orb'], $transitMode),
                ];
            }
        }
        usort($found, fn (array $a, array $b) => $a['orb'] <=> $b['orb']);
        return array_slice($found, 0, 5);
    }

    public function show(Relationship $relationship, Request $request): JsonResponse
    {
        $this->ensureParticipant($relationship, $request);
        $userId = (int) $request->user()->id;
        $otherId = $relationship->user_one_id === $userId ? $relationship->user_two_id : $relationship->user_one_id;
        $profiles = CycleProfile::whereIn('user_id', [$userId, $otherId])->get()->keyBy('user_id');
        $mine = $profiles->get($userId);
        $theirs = $profiles->get($otherId);
        $allPreferences = $relationship->sharing_preferences ?? [];
        $defaults = ['cycle_details' => false, 'pregnancy_details' => false, 'wellbeing_updates' => false, 'astrology' => false];
        $myPreferences = array_merge($defaults, $allPreferences[(string) $userId] ?? []);
        $theirPreferences = array_merge($defaults, $allPreferences[(string) $otherId] ?? []);
        $primaryPreferences = $allPreferences[(string) $relationship->user_one_id] ?? $allPreferences;
        $shareAstrology = $relationship->relationship_type === 'observer'
            ? (bool) (($primaryPreferences['astrology'] ?? false)
                && $mine?->wants_astrology && $theirs?->wants_astrology)
            : (bool) ($myPreferences['astrology'] && $theirPreferences['astrology'] && $mine?->wants_astrology && $theirs?->wants_astrology);

        $mineChart = $shareAstrology ? $this->chartForProfile($mine) : ['placements' => [], 'birth_time_known' => false];
        $theirChart = $shareAstrology ? $this->chartForProfile($theirs) : ['placements' => [], 'birth_time_known' => false];
        $compatibility = [
            'available' => false,
            'score' => null,
            'summary' => 'Both people can opt in to astrology and add birth date, time (if known) and birthplace to explore their natal connection.',
            'themes' => [],
            'aspects' => [],
            'charts' => [
                'left' => $mineChart['placements'] ?? [],
                'right' => $theirChart['placements'] ?? [],
                'left_time_known' => (bool) ($mineChart['birth_time_known'] ?? false),
                'right_time_known' => (bool) ($theirChart['birth_time_known'] ?? false),
            ],
        ];
        if ($shareAstrology && $mine && $theirs) {
            $pairs = [
                ['label' => 'Sun signs', 'left' => $this->chartSign($mineChart['placements'] ?? [], 'sun') ?? $mine->sun_sign, 'right' => $this->chartSign($theirChart['placements'] ?? [], 'sun') ?? $theirs->sun_sign],
                ['label' => 'Moon signs', 'left' => ($mineChart['birth_time_known'] ?? false) ? ($this->chartSign($mineChart['placements'] ?? [], 'moon') ?? $mine->moon_sign) : null, 'right' => ($theirChart['birth_time_known'] ?? false) ? ($this->chartSign($theirChart['placements'] ?? [], 'moon') ?? $theirs->moon_sign) : null],
                ['label' => 'Rising signs', 'left' => ($mineChart['birth_time_known'] ?? false) ? ($this->chartSign($mineChart['placements'] ?? [], 'rising') ?? $mine->rising_sign) : null, 'right' => ($theirChart['birth_time_known'] ?? false) ? ($this->chartSign($theirChart['placements'] ?? [], 'rising') ?? $theirs->rising_sign) : null],
            ];
            foreach ($pairs as $pair) {
                $tone = $this->signTone($pair['left'], $pair['right'], $pair['label']);
                if ($tone) $compatibility['themes'][] = ['label' => $pair['label'], 'left' => $pair['left'], 'right' => $pair['right'], ...$tone];
            }
            $compatibility['aspects'] = $this->aspects(
                $mineChart['placements'] ?? [],
                $theirChart['placements'] ?? [],
                (bool) ($mineChart['birth_time_known'] ?? false),
                (bool) ($theirChart['birth_time_known'] ?? false)
            );
            if ($compatibility['themes'] !== [] || $compatibility['aspects'] !== [] || ($mine->sun_sign && $theirs->sun_sign)) {
                $scoreParts = [];
                foreach ($compatibility['themes'] as $theme) {
                    $scoreParts[] = match ($theme['tone']) { 'familiar' => 82, 'resonant' => 78, 'complementary' => 80, default => 66 };
                }
                foreach ($compatibility['aspects'] as $aspect) {
                    $scoreParts[] = match ($aspect['tone']) { 'supportive' => 84, 'intense' => 72, default => 61 };
                }
                if (!$scoreParts && $mine->sun_sign && $theirs->sun_sign) {
                    $sunTone = $this->signTone($mine->sun_sign, $theirs->sun_sign);
                    $scoreParts[] = match ($sunTone['tone'] ?? 'contrasting') { 'familiar' => 82, 'resonant' => 78, 'complementary' => 80, default => 66 };
                }
                $compatibility['score'] = $scoreParts ? (int) round(array_sum($scoreParts) / count($scoreParts)) : null;
                $compatibility['available'] = true;
                $compatibility['summary'] = 'A reflective comparison of the natal sign placements and planetary aspects available for both profiles. It is an invitation to understand each other, not a verdict about your relationship.';
            }
        }

        $isPrimaryViewer = $userId === (int) $relationship->user_one_id;
        $canUseCycleContext = $isPrimaryViewer || (bool) ($primaryPreferences['cycle_details'] ?? false);
        $canUseSymptoms = $isPrimaryViewer || (bool) ($primaryPreferences['wellbeing_updates'] ?? false);
        $today = now($mine?->timezone ?: 'UTC')->toDateString();
        $primaryUserForCache = User::find($relationship->user_one_id);
        $primaryTimezoneForCache = $primaryUserForCache?->cycleProfile?->timezone ?: 'UTC';
        $primaryDateForCache = CarbonImmutable::today($primaryTimezoneForCache)->toDateString();
        $primaryPeriodForCache = $primaryUserForCache?->periodLogs()->orderByDesc('start_date')->value('start_date') ?? '';
        $primaryCheckinForCache = $primaryUserForCache?->dailyCheckins()->whereDate('log_date', $primaryDateForCache)->value('updated_at') ?? '';
        $cacheKey = 'crescent:relationship-insight:'.$relationship->id.':'.$today.':'.($shareAstrology ? 'astrology-on' : 'astrology-off').':'.($canUseCycleContext ? 'cycle-on' : 'cycle-off').':'.($canUseSymptoms ? 'symptoms-on' : 'symptoms-off').':'.hash('sha256', implode('|', [$mine?->birth_date?->format('Y-m-d') ?? '', $mine?->birth_time ?? '', $theirs?->birth_date?->format('Y-m-d') ?? '', $theirs?->birth_time ?? '', $primaryPeriodForCache, (string) $primaryCheckinForCache]));
        $mineForInsight = $shareAstrology ? $mine : null;
        $theirsForInsight = $shareAstrology ? $theirs : null;
        $insight = Cache::remember($cacheKey, now('UTC')->endOfDay(), function () use ($relationship, $mineForInsight, $theirsForInsight, $mineChart, $theirChart, $shareAstrology, $compatibility, $today, $canUseCycleContext, $canUseSymptoms) {
            $sky = $this->skySnapshot();
            $moon = collect($sky)->firstWhere('name', 'Moon');
            $venus = collect($sky)->firstWhere('name', 'Venus');
            $mercury = collect($sky)->firstWhere('name', 'Mercury');
            $sun = collect($sky)->firstWhere('name', 'Sun');
            $natalSigns = array_filter([$mineForInsight?->sun_sign, $mineForInsight?->moon_sign, $theirsForInsight?->sun_sign, $theirsForInsight?->moon_sign]);
            $moonElement = self::ELEMENTS[$moon['sign'] ?? ''] ?? null;
            $hasSharedSign = count(array_intersect($natalSigns, array_filter([$moon['sign'] ?? null, $venus['sign'] ?? null, $mercury['sign'] ?? null]))) > 0;
            $primary = User::with('cycleProfile')->find($relationship->user_one_id);
            $primaryProfile = $primary?->cycleProfile;
            $timezone = $primaryProfile?->timezone ?: 'UTC';
            $localToday = CarbonImmutable::today($timezone);
            $lastPeriod = $primary?->periodLogs()->orderByDesc('start_date')->first();
            $cycleDay = null;
            $phase = 'cycle-unknown';
            if ($canUseCycleContext && $lastPeriod && $primaryProfile?->average_cycle_length) {
                $periodStart = CarbonImmutable::parse($lastPeriod->start_date->format('Y-m-d'), $timezone)->startOfDay();
                $cycleDay = (int) $periodStart->diffInDays($localToday) + 1;
                $cycleDay = (($cycleDay - 1) % max(1, $primaryProfile->average_cycle_length)) + 1;
                $periodLength = max(1, (int) ($primaryProfile->average_period_length ?? 5));
                if ($cycleDay <= $periodLength) $phase = 'menstrual';
                elseif (($primaryProfile->cycle_regularity ?? 'unknown') === 'irregular') $phase = 'cycle-unknown';
                elseif ($cycleDay < max($periodLength + 1, (int) $primaryProfile->average_cycle_length - 13)) $phase = 'follicular';
                elseif ($cycleDay <= (int) $primaryProfile->average_cycle_length - 12) $phase = 'ovulatory-estimate';
                else $phase = 'luteal';
            }
            $checkin = $canUseSymptoms ? $primary?->dailyCheckins()->whereDate('log_date', $localToday->toDateString())->first() : null;
            $symptoms = array_map('strtolower', (array) ($checkin?->symptoms ?? []));
            $periodLengthForTip = max(1, (int) ($primaryProfile?->average_period_length ?? 5));
            $cycleLengthForTip = (int) ($primaryProfile?->average_cycle_length ?? 28);
            $phaseStart = match ($phase) {
                'menstrual' => 1,
                'follicular' => $periodLengthForTip + 1,
                'ovulatory-estimate' => max($periodLengthForTip + 1, $cycleLengthForTip - 13),
                'luteal' => $cycleLengthForTip - 11,
                default => 1,
            };
            $dayInPhase = $cycleDay !== null ? max(0, $cycleDay - $phaseStart) : null;
            $tipIndex = 0;
            $chosen = RelationshipReflections::pick($phase, $dayInPhase, (int) $localToday->format('j'));
            if ($canUseSymptoms && array_intersect($symptoms, ['bloating', 'bloated', 'cramps', 'cramping', 'fatigue', 'tired', 'headache'])) {
                $chosen = ['Notice what they logged today', 'Your partner logged '.implode(', ', array_slice(array_intersect($symptoms, ['bloating','bloated','cramps','cramping','fatigue','tired','headache']), 0, 3)).'. Offer a heat pack, comfy clothes, a kind compliment if welcome, or one practical task. Ask what would actually help and do not dismiss their discomfort.'];
            }
            if (!$canUseCycleContext) {
                $phase = 'cycle-unknown';
                $cycleDay = null;
                $chosen = RelationshipReflections::pick('cycle-unknown', null, (int) $localToday->format('j'));
            }
            if (!$canUseSymptoms) {
                $symptoms = [];
            }
            $chosen = ['title' => $chosen[0], 'tip' => $chosen[1]];
            $personalTransits = $shareAstrology ? array_merge(
                array_map(fn (array $aspect) => array_merge($aspect, ['chart_owner' => 'Your chart', 'text' => AstroInterpreter::aspect($aspect['left'], $aspect['right'], $aspect['aspect'], (float) $aspect['orb'], true, 'Your chart')]), $this->aspects($sky, $mineChart['placements'] ?? [], true, (bool) ($mineChart['birth_time_known'] ?? false), true)),
                array_map(fn (array $aspect) => array_merge($aspect, ['chart_owner' => 'Companion chart', 'text' => AstroInterpreter::aspect($aspect['left'], $aspect['right'], $aspect['aspect'], (float) $aspect['orb'], true, 'Companion chart')]), $this->aspects($sky, $theirChart['placements'] ?? [], true, (bool) ($theirChart['birth_time_known'] ?? false), true))
            ) : [];
            usort($personalTransits, fn (array $a, array $b) => $a['orb'] <=> $b['orb']);
            $personalTransits = array_slice($personalTransits, 0, 5);
            $transitNote = $moon && $venus
                ? 'Today’s sky snapshot: Moon in '.($moon['sign'] ?? 'an unreported sign').' and Venus in '.($venus['sign'] ?? 'an unreported sign').'.'
                : 'The current sky feed is unavailable, so today’s suggestion uses a general relationship reflection.';
            if ($hasSharedSign) $transitNote .= ' A current planetary sign echoes a sign in one of your available natal profiles; use that as a prompt for reflection, not a prediction.';
            if ($moonElement === 'water') $chosen['tip'] = 'Give feelings a little room before trying to solve them. '.$chosen['tip'];
            return [
                'date' => $today,
                'cycle_context' => ['phase' => $phase, 'cycle_day' => $cycleDay, 'based_on_primary_partner' => true, 'available' => $canUseCycleContext],
                'title' => $chosen['title'],
                'tip' => $chosen['tip'],
                'transit_note' => $transitNote,
                'transits' => array_values(array_filter([$sun, $moon, $venus, $mercury])),
                'personal_transits' => $personalTransits,
                'source' => $shareAstrology ? 'Current planetary positions compared with both opted-in natal charts' : 'Current planetary sign snapshot and general relationship reflection',
                'relationship_type' => $relationship->relationship_type,
            ];
        });

        CosmicCompatibility::updateOrCreate(
            ['relationship_id' => $relationship->id],
            ['insight_payload' => ['compatibility' => $compatibility, 'daily' => $insight], 'calculation_version' => 'v2', 'calculated_at' => now()]
        );

        return response()->json(['compatibility' => $compatibility, 'daily' => $insight]);
    }
}
