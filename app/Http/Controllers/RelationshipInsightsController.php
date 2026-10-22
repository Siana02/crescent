<?php

namespace App\Http\Controllers;

use App\Models\CosmicCompatibility;
use App\Models\Relationship;
use App\Models\CycleProfile;
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

    private function signTone(?string $left, ?string $right): ?array
    {
        if (! $left || ! $right) return null;
        $a = self::ELEMENTS[$left] ?? null;
        $b = self::ELEMENTS[$right] ?? null;
        if (! $a || ! $b) return null;
        if ($left === $right) return ['tone' => 'familiar', 'text' => 'You may recognise something of yourself in each other. Make room for your differences, too.'];
        if ($a === $b) return ['tone' => 'resonant', 'text' => 'You share an elemental style. It can feel easy to understand one another, while making it useful to slow down and check assumptions.'];
        $pairs = [$a, $b]; sort($pairs);
        if (in_array($pairs, [['air', 'fire'], ['earth', 'water']], true)) {
            return ['tone' => 'complementary', 'text' => 'These elements are traditionally read as complementary. Notice where your different strengths help you meet in the middle.'];
        }
        return ['tone' => 'contrasting', 'text' => 'Your styles may approach things differently. Curiosity and clear questions can help a difference become a conversation rather than a conflict.'];
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
                    'text' => $transitMode
                        ? ($supportive ? 'A potentially supportive opening for this theme. Notice what feels easier, without treating it as guaranteed.' : 'A reflective pressure point around this theme. Slow down, check assumptions and choose a practical response.')
                        : ($supportive ? 'Traditionally read as a flowing connection between these planetary themes.' : 'Traditionally read as a more active connection that can invite awareness, negotiation and growth.'),
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
        $shareAstrology = (bool) ($myPreferences['astrology'] && $theirPreferences['astrology']);

        $mineChart = $shareAstrology ? $this->chartForProfile($mine) : ['placements' => [], 'birth_time_known' => false];
        $theirChart = $shareAstrology ? $this->chartForProfile($theirs) : ['placements' => [], 'birth_time_known' => false];
        $compatibility = [
            'available' => false,
            'summary' => 'Both people can opt in to astrology and add birth date, time (if known) and birthplace to explore their natal connection.',
            'themes' => [],
            'aspects' => [],
        ];
        if ($shareAstrology && $mine && $theirs) {
            $pairs = [
                ['label' => 'Sun signs', 'left' => $mine->sun_sign, 'right' => $theirs->sun_sign],
                ['label' => 'Moon signs', 'left' => ($mineChart['birth_time_known'] ?? false) ? $mine->moon_sign : null, 'right' => ($theirChart['birth_time_known'] ?? false) ? $theirs->moon_sign : null],
                ['label' => 'Rising signs', 'left' => ($mineChart['birth_time_known'] ?? false) ? $mine->rising_sign : null, 'right' => ($theirChart['birth_time_known'] ?? false) ? $theirs->rising_sign : null],
            ];
            foreach ($pairs as $pair) {
                $tone = $this->signTone($pair['left'], $pair['right']);
                if ($tone) $compatibility['themes'][] = ['label' => $pair['label'], 'left' => $pair['left'], 'right' => $pair['right'], ...$tone];
            }
            $compatibility['aspects'] = $this->aspects(
                $mineChart['placements'] ?? [],
                $theirChart['placements'] ?? [],
                (bool) ($mineChart['birth_time_known'] ?? false),
                (bool) ($theirChart['birth_time_known'] ?? false)
            );
            if ($compatibility['themes'] !== [] || $compatibility['aspects'] !== []) {
                $compatibility['available'] = true;
                $compatibility['summary'] = 'A reflective comparison of the natal sign placements and planetary aspects available for both profiles. It is an invitation to understand each other, not a verdict about your relationship.';
            }
        }

        $today = now('UTC')->toDateString();
        $cacheKey = 'crescent:relationship-insight:'.$relationship->id.':'.$today.':'.($shareAstrology ? 'astrology-on' : 'astrology-off').':'.hash('sha256', implode('|', [$mine?->birth_date?->format('Y-m-d') ?? '', $mine?->birth_time ?? '', $theirs?->birth_date?->format('Y-m-d') ?? '', $theirs?->birth_time ?? '']));
        $mineForInsight = $shareAstrology ? $mine : null;
        $theirsForInsight = $shareAstrology ? $theirs : null;
        $insight = Cache::remember($cacheKey, now('UTC')->endOfDay(), function () use ($relationship, $mineForInsight, $theirsForInsight, $mineChart, $theirChart, $shareAstrology, $compatibility, $today) {
            $sky = $this->skySnapshot();
            $moon = collect($sky)->firstWhere('name', 'Moon');
            $venus = collect($sky)->firstWhere('name', 'Venus');
            $mercury = collect($sky)->firstWhere('name', 'Mercury');
            $sun = collect($sky)->firstWhere('name', 'Sun');
            $natalSigns = array_filter([$mineForInsight?->sun_sign, $mineForInsight?->moon_sign, $theirsForInsight?->sun_sign, $theirsForInsight?->moon_sign]);
            $moonElement = self::ELEMENTS[$moon['sign'] ?? ''] ?? null;
            $hasSharedSign = count(array_intersect($natalSigns, array_filter([$moon['sign'] ?? null, $venus['sign'] ?? null, $mercury['sign'] ?? null]))) > 0;
            $themes = [
                ['title' => 'Make room for a check-in', 'tip' => 'Ask one open question and give the other person time to answer before jumping into solutions.'],
                ['title' => 'Small care counts', 'tip' => 'Offer one specific act of care today, and make it easy for your partner to say what would help most.'],
                ['title' => 'Be curious, not certain', 'tip' => 'If something feels off, check what your partner meant instead of filling in the blanks yourself.'],
                ['title' => 'Share the invisible load', 'tip' => 'Choose one practical task to make lighter for each other, then agree who will do what.'],
                ['title' => 'Celebrate your different rhythms', 'tip' => 'You do not need to feel the same way to support each other. Ask whether they want listening, closeness or space.'],
            ];
            $index = (int) (crc32($today.'|'.$relationship->id.'|'.($mineForInsight?->sun_sign ?? '').'|'.($theirsForInsight?->sun_sign ?? '')) % count($themes));
            $chosen = $themes[$index];
            $personalTransits = $shareAstrology ? array_merge(
                array_map(fn (array $aspect) => array_merge($aspect, ['chart_owner' => 'Your chart']), $this->aspects($sky, $mineChart['placements'] ?? [], true, (bool) ($mineChart['birth_time_known'] ?? false), true)),
                array_map(fn (array $aspect) => array_merge($aspect, ['chart_owner' => 'Companion chart']), $this->aspects($sky, $theirChart['placements'] ?? [], true, (bool) ($theirChart['birth_time_known'] ?? false), true))
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
