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

    public function show(Relationship $relationship, Request $request): JsonResponse
    {
        $this->ensureParticipant($relationship, $request);
        $userId = (int) $request->user()->id;
        $otherId = $relationship->user_one_id === $userId ? $relationship->user_two_id : $relationship->user_one_id;
        $profiles = CycleProfile::whereIn('user_id', [$userId, $otherId])->get()->keyBy('user_id');
        $mine = $profiles->get($userId);
        $theirs = $profiles->get($otherId);
        $shareAstrology = (bool) ($relationship->sharing_preferences['astrology'] ?? true);

        $compatibility = [
            'available' => false,
            'summary' => 'Add birth dates to both profiles to begin exploring your celestial connection.',
            'themes' => [],
        ];
        if ($shareAstrology && $mine && $theirs && ($mine->wants_astrology || $theirs->wants_astrology)) {
            $pairs = [
                ['label' => 'Sun signs', 'left' => $mine->sun_sign, 'right' => $theirs->sun_sign],
                ['label' => 'Moon signs', 'left' => $mine->moon_sign, 'right' => $theirs->moon_sign],
                ['label' => 'Rising signs', 'left' => $mine->rising_sign, 'right' => $theirs->rising_sign],
            ];
            foreach ($pairs as $pair) {
                $tone = $this->signTone($pair['left'], $pair['right']);
                if ($tone) $compatibility['themes'][] = ['label' => $pair['label'], 'left' => $pair['left'], 'right' => $pair['right'], ...$tone];
            }
            if ($compatibility['themes'] !== []) {
                $compatibility['available'] = true;
                $compatibility['summary'] = 'A reflective reading of the natal sign placements currently available for both profiles. It is an invitation to understand each other, not a verdict about your relationship.';
            }
        }

        $today = now('UTC')->toDateString();
        $cacheKey = 'crescent:relationship-insight:'.$relationship->id.':'.$today;
        $insight = Cache::remember($cacheKey, now('UTC')->endOfDay(), function () use ($relationship, $mine, $theirs, $compatibility, $today) {
            $sky = $this->skySnapshot();
            $moon = collect($sky)->firstWhere('name', 'Moon');
            $venus = collect($sky)->firstWhere('name', 'Venus');
            $mercury = collect($sky)->firstWhere('name', 'Mercury');
            $sun = collect($sky)->firstWhere('name', 'Sun');
            $natalSigns = array_filter([$mine?->sun_sign, $mine?->moon_sign, $theirs?->sun_sign, $theirs?->moon_sign]);
            $moonElement = self::ELEMENTS[$moon['sign'] ?? ''] ?? null;
            $hasSharedSign = count(array_intersect($natalSigns, array_filter([$moon['sign'] ?? null, $venus['sign'] ?? null, $mercury['sign'] ?? null]))) > 0;
            $themes = [
                ['title' => 'Make room for a check-in', 'tip' => 'Ask one open question and give the other person time to answer before jumping into solutions.'],
                ['title' => 'Small care counts', 'tip' => 'Offer one specific act of care today, and make it easy for your partner to say what would help most.'],
                ['title' => 'Be curious, not certain', 'tip' => 'If something feels off, check what your partner meant instead of filling in the blanks yourself.'],
                ['title' => 'Share the invisible load', 'tip' => 'Choose one practical task to make lighter for each other, then agree who will do what.'],
                ['title' => 'Celebrate your different rhythms', 'tip' => 'You do not need to feel the same way to support each other. Ask whether they want listening, closeness or space.'],
            ];
            $index = (int) (crc32($today.'|'.$relationship->id.'|'.($mine?->sun_sign ?? '').'|'.($theirs?->sun_sign ?? '')) % count($themes));
            $chosen = $themes[$index];
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
                'source' => 'Current planetary sign snapshot and available natal sign placements',
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
