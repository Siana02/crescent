<?php

namespace App\Support;

/**
 * Written interpretations for astrology insights. Every planetary pair, sign
 * placement and aspect type has its own wording so no two readings repeat.
 */
class AstroInterpreter
{
    private const ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

    /** Meaning of each planetary pairing, keyed in zodiac-tradition order. */
    private const PAIRS = [
        'Sun-Sun' => 'Two core identities meet: this is about how you each shine, what makes you feel alive and whether you give one another room to be fully yourselves.',
        'Sun-Moon' => 'Conscious identity meets emotional need. It speaks to how what one of you wants to become fits with what the other needs in order to feel safe and at home.',
        'Sun-Mercury' => 'Identity meets the way you think and talk. It shapes how easily you feel understood, and whether conversation helps you feel more like yourselves.',
        'Sun-Venus' => 'Identity meets affection and taste. It is the pairing most associated with enjoying each other, appreciating one another and valuing similar pleasures.',
        'Sun-Mars' => 'Identity meets drive. It describes how you motivate, challenge or compete with each other, and how anger and ambition get handled.',
        'Sun-Jupiter' => 'Identity meets optimism and growth. It points to encouragement, generosity and the feeling of being believed in, as well as a tendency to overpromise.',
        'Sun-Saturn' => 'Identity meets responsibility and limits. It speaks to commitment, seriousness and the way structure or criticism can steady or weigh on the sense of self.',
        'Moon-Moon' => 'Two emotional worlds meet. It describes how comfort, moods and routines are shared, and whether you soothe feelings in similar or different ways.',
        'Moon-Mercury' => 'Feeling meets thinking. It shows how well emotions get put into words, and whether one of you analyses what the other simply wants to feel.',
        'Moon-Venus' => 'Emotional need meets affection. It is associated with tenderness, small gestures of care and a shared sense of what makes home feel sweet.',
        'Moon-Mars' => 'Emotional need meets assertiveness. It governs how quickly feelings turn into reactions, and how you handle irritation, passion and defensiveness.',
        'Moon-Jupiter' => 'Emotional need meets generosity. It suggests warmth, reassurance and big-hearted support, with a caution about exaggerating or indulging moods.',
        'Moon-Saturn' => 'Emotional need meets restraint. It can feel like dependable steadiness or like emotional reserve, depending on how openly needs are voiced.',
        'Mercury-Mercury' => 'Two minds meet. It speaks to communication styles, how you process information, make plans and tell stories to one another.',
        'Mercury-Venus' => 'Communication meets affection. It is the pairing of kind words, flirting, diplomacy and the pleasure of conversation that feels sweet.',
        'Mercury-Mars' => 'Communication meets drive. It describes debates, quick wit and directness, and how sharp words can be when tempers rise.',
        'Mercury-Jupiter' => 'Communication meets perspective. It brings big-picture conversations, humour and learning together, along with a risk of talking past the details.',
        'Mercury-Saturn' => 'Communication meets caution. It points to careful, precise talk, serious discussions and a tendency toward worry or understatement.',
        'Venus-Venus' => 'Two ways of loving meet. It reflects shared values, love languages, taste and what each of you finds beautiful and worth spending time on.',
        'Venus-Mars' => 'Affection meets desire. It is traditionally linked with attraction and chemistry, and with how pursuit, flirtation and intimacy are balanced.',
        'Venus-Jupiter' => 'Affection meets abundance. It suggests generosity, celebration and enjoyment together, and a reminder to keep spending and indulgence in balance.',
        'Venus-Saturn' => 'Affection meets commitment. It describes loyalty and a slower-building love, and the possibility of reserve or fear of rejection around vulnerability.',
        'Mars-Mars' => 'Two drives meet. It shows how you each pursue goals, handle conflict and share energy, whether as teammates or as rivals.',
        'Mars-Jupiter' => 'Drive meets expansion. It brings enthusiasm, adventure and ambitious plans, and may need a check on impulsiveness or overreach.',
        'Mars-Saturn' => 'Drive meets discipline. It describes effort, endurance and patience, and also frustration when one wants to rush and the other to hold back.',
        'Jupiter-Jupiter' => 'Two philosophies meet. It speaks to shared beliefs, hopes for the future and what each of you considers a meaningful life.',
        'Jupiter-Saturn' => 'Growth meets realism. It balances dreaming with planning, and can turn big ideas into lasting structures if both voices are respected.',
        'Saturn-Saturn' => 'Two senses of duty meet. It reflects shared standards, how you build routines and what each expects from commitment and responsibility.',
    ];

    private const URGES = [
        'Sun' => 'need to be seen and to lead',
        'Moon' => 'need for safety and comfort',
        'Mercury' => 'need to talk things through',
        'Venus' => 'wish for affection and harmony',
        'Mars' => 'urge to act and assert',
        'Jupiter' => 'wish to expand and stay hopeful',
        'Saturn' => 'need for structure and reliability',
    ];

    /** Templates: %1$s/%2$s are the planet names, %3$s/%4$s their urges. */
    private const ASPECTS = [
        'Conjunction' => 'As a conjunction, %1$s\'s %3$s and %2$s\'s %4$s fuse into a single theme. It is intense and hard to separate, so name which urge is speaking.',
        'Sextile' => 'As a sextile, %1$s\'s %3$s and %2$s\'s %4$s can cooperate if someone makes the first move. It is an opportunity, not an automatic gift.',
        'Square' => 'As a square, %1$s\'s %3$s rubs against %2$s\'s %4$s. This friction is traditionally read as a push to negotiate and adjust, not as a verdict.',
        'Trine' => 'As a trine, %1$s\'s %3$s and %2$s\'s %4$s support each other with ease. Because it feels natural, it helps to use it on purpose.',
        'Opposition' => 'As an opposition, %1$s\'s %3$s and %2$s\'s %4$s sit on opposite sides of a seesaw. The work is balancing both views, not choosing one.',
    ];

    private const ORBS = [
        'tight' => 'The orb is very tight, so this theme is emphasised.',
        'close' => 'The orb is fairly close, so this theme is clearly present.',
        'wide' => 'The orb is wider, so treat this as a quiet background influence.',
    ];

    private const SIGNS = [
        'Aries' => ['element' => 'fire', 'mode' => 'cardinal', 'sun' => 'a direct, courageous and self-starting core', 'moon' => 'needs movement, honesty and quick resolution of feelings', 'rising' => 'comes across as bold, energetic and quick to act'],
        'Taurus' => ['element' => 'earth', 'mode' => 'fixed', 'sun' => 'a steady, sensual and loyal core', 'moon' => 'needs comfort, routine and physical reassurance', 'rising' => 'comes across as calm, grounded and unhurried'],
        'Gemini' => ['element' => 'air', 'mode' => 'mutable', 'sun' => 'a curious, witty and adaptable core', 'moon' => 'needs conversation, variety and mental stimulation to feel settled', 'rising' => 'comes across as chatty, light and inquisitive'],
        'Cancer' => ['element' => 'water', 'mode' => 'cardinal', 'sun' => 'a nurturing, protective and sensitive core', 'moon' => 'needs closeness, home and emotional safety', 'rising' => 'comes across as gentle, careful and a little guarded at first'],
        'Leo' => ['element' => 'fire', 'mode' => 'fixed', 'sun' => 'a warm, proud and generous core', 'moon' => 'needs to feel appreciated, celebrated and seen', 'rising' => 'comes across as confident, expressive and magnetic'],
        'Virgo' => ['element' => 'earth', 'mode' => 'mutable', 'sun' => 'a thoughtful, practical and service-minded core', 'moon' => 'needs order, usefulness and quiet time to process', 'rising' => 'comes across as modest, observant and organised'],
        'Libra' => ['element' => 'air', 'mode' => 'cardinal', 'sun' => 'a fair-minded, charming and harmony-seeking core', 'moon' => 'needs peace, companionship and balanced give-and-take', 'rising' => 'comes across as polished, friendly and diplomatic'],
        'Scorpio' => ['element' => 'water', 'mode' => 'fixed', 'sun' => 'an intense, private and determined core', 'moon' => 'needs depth, trust and total emotional honesty', 'rising' => 'comes across as intense, perceptive and a little mysterious'],
        'Sagittarius' => ['element' => 'fire', 'mode' => 'mutable', 'sun' => 'an adventurous, optimistic and freedom-loving core', 'moon' => 'needs space, humour and a sense of possibility', 'rising' => 'comes across as open, enthusiastic and outspoken'],
        'Capricorn' => ['element' => 'earth', 'mode' => 'cardinal', 'sun' => 'a disciplined, ambitious and dependable core', 'moon' => 'needs stability, respect and feeling competent', 'rising' => 'comes across as composed, mature and reserved'],
        'Aquarius' => ['element' => 'air', 'mode' => 'fixed', 'sun' => 'an independent, original and idealistic core', 'moon' => 'needs freedom, friendship and room to think differently', 'rising' => 'comes across as unconventional, cool and individual'],
        'Pisces' => ['element' => 'water', 'mode' => 'mutable', 'sun' => 'an imaginative, compassionate and dreamy core', 'moon' => 'needs gentleness, creativity and time alone to recharge', 'rising' => 'comes across as soft, intuitive and hard to pin down'],
    ];

    private const ELEMENT_PAIRS = [
        'fire-fire' => 'Two fires feed each other: spontaneity and enthusiasm come easily, and so can quick tempers, so build in a pause.',
        'earth-earth' => 'Two earths build steadily: you value reliability and comfort, and may need to deliberately add play and flexibility.',
        'air-air' => 'Two airs share ideas easily: conversation flows, while feelings can stay unspoken unless one of you names them.',
        'water-water' => 'Two waters share a deep emotional current: empathy comes naturally, and moods can amplify each other without clear boundaries.',
        'air-fire' => 'Air and fire are traditionally complementary: ideas fan enthusiasm, and plans get made quickly, so check that no one is being rushed.',
        'earth-water' => 'Earth and water are traditionally complementary: practical care holds emotional depth, like soil holding a stream.',
        'earth-fire' => 'Fire and earth differ in tempo: one wants to leap while the other wants to build, which can balance or frustrate depending on how you negotiate.',
        'fire-water' => 'Fire and water differ in temperature: passion meets sensitivity, so gentle wording matters when one is fiery and the other is tender.',
        'air-earth' => 'Air and earth differ in focus: one lives in ideas and options, the other in what is practical, so agree on a shared next step.',
        'air-water' => 'Air and water differ in language: one explains while the other feels, and each benefits from translating for the other.',
    ];

    private const MODE_NOTES = [
        'cardinal' => 'starts things',
        'fixed' => 'holds steady',
        'mutable' => 'adapts',
    ];

    private const LABELS = [
        'Sun signs' => ['key' => 'sun', 'stem' => 'The Sun shows core identity and vitality'],
        'Moon signs' => ['key' => 'moon', 'stem' => 'The Moon shows emotional needs and what feels safe'],
        'Rising signs' => ['key' => 'rising', 'stem' => 'The Rising sign shows first impressions and style of meeting the world'],
    ];

    public static function pairMeaning(string $a, string $b): string
    {
        $ia = array_search($a, self::ORDER, true);
        $ib = array_search($b, self::ORDER, true);
        if ($ia === false || $ib === false) {
            return $a.' and '.$b.' combine two symbolic themes worth talking about together.';
        }
        [$first, $second] = $ia <= $ib ? [$a, $b] : [$b, $a];
        return self::PAIRS[$first.'-'.$second];
    }

    public static function aspect(string $left, string $right, string $aspect, float $orb, bool $transit = false, ?string $owner = null): string
    {
        $orbNote = $orb <= 1.5 ? self::ORBS['tight'] : ($orb <= 3.5 ? self::ORBS['close'] : self::ORBS['wide']);
        $dynamic = sprintf(self::ASPECTS[$aspect] ?? '', $left, $right, self::URGES[$left] ?? 'energy', self::URGES[$right] ?? 'energy');
        $meaning = self::pairMeaning($left, $right);
        if ($transit) {
            $subject = $owner === 'Companion chart' ? 'their' : 'your';
            return 'Today\'s '.$left.' forms a '.strtolower($aspect).' with '.$subject.' natal '.$right.'. '.$meaning.' '.$dynamic.' '.$orbNote;
        }
        return $left.' '.strtolower($aspect).' '.$right.': '.$meaning.' '.$dynamic.' '.$orbNote;
    }

    public static function signTheme(string $label, string $left, string $right): ?array
    {
        $spec = self::LABELS[$label] ?? null;
        $a = self::SIGNS[$left] ?? null;
        $b = self::SIGNS[$right] ?? null;
        if (! $spec || ! $a || ! $b) {
            return null;
        }
        $key = $spec['key'];
        $describe = function (string $sign, array $data) use ($key): string {
            return match ($key) {
                'sun' => $sign.' has '.$data['sun'],
                'moon' => $sign.' '.$data['moon'],
                default => $sign.' '.$data['rising'],
            };
        };
        $elements = [$a['element'], $b['element']];
        sort($elements);
        $element = $left === $right
            ? 'With the same sign you may see yourself in each other, which can feel instantly familiar and also magnify shared blind spots.'
            : (self::ELEMENT_PAIRS[$elements[0].'-'.$elements[1]] ?? '');
        $mode = $a['mode'] === $b['mode']
            ? 'You are both '.$a['mode'].' signs, so each of you '.self::MODE_NOTES[$a['mode']].' in a similar way.'
            : $left.' '.self::MODE_NOTES[$a['mode']].' while '.$right.' '.self::MODE_NOTES[$b['mode']].', so notice who sets the pace.';
        $tone = $left === $right ? 'familiar' : ($a['element'] === $b['element'] ? 'resonant' : (in_array($elements, [['air', 'fire'], ['earth', 'water']], true) ? 'complementary' : 'contrasting'));

        return ['tone' => $tone, 'text' => $spec['stem'].'. '.$describe($left, $a).'; '.$describe($right, $b).'. '.$element.' '.$mode];
    }
}
