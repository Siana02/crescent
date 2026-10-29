<?php

namespace App\Support;

/**
 * Cycle-phase based relationship reflections. Each phase has enough entries that
 * every day of a typical phase gets its own message; with no cycle data a
 * 31-entry set rotates by day of the month.
 */
class RelationshipReflections
{
    private const MENSTRUAL = [
        ['Start with what feels physically kind', 'Period pain is common, and for some people it is severe enough to disrupt daily life. Ask what would ease today, then act on the answer rather than your guess.'],
        ['Rest is a valid plan', 'Bleeding commonly lasts between two and seven days and tiredness is frequently reported. Protecting rest is a way of caring, not a way of cancelling the relationship.'],
        ['Listen before you problem-solve', 'When someone is uncomfortable, advice can feel like pressure. Try “Do you want help, company or quiet?” and accept any of the three.'],
        ['Share the invisible load', 'Fatigue makes small tasks feel bigger. Taking an errand, a meal or an admin job off the list is often noticed more than a gift.'],
        ['Normalise the conversation', 'Periods are a normal part of many people\'s lives. Being relaxed and matter-of-fact about them helps your partner feel it is safe to be honest.'],
        ['Notice what is not said', 'Some people feel relief as bleeding lightens and others still feel drained. Check in without assuming which one it is.'],
        ['Mind the pain that is not normal', 'Pain that is severe, worsening or not eased by usual measures deserves medical attention. Encourage a check-up and offer to come along if wanted.'],
    ];

    private const FOLLICULAR = [
        ['A fresh start can be shared', 'Oestrogen rises through the follicular phase and many people report feeling more upbeat. Others do not, so invite rather than expect.'],
        ['Plan something together', 'If energy feels good, a shared plan like a walk or a new recipe can help the two of you reconnect. Offer a choice and a graceful way to say no.'],
        ['Appreciate out loud', 'Specific appreciation strengthens relationships more than general praise. Name one thing your partner did recently that mattered to you.'],
        ['Revisit shared goals', 'Calmer days are a good moment for practical conversations about money, time or plans. Choose a time you both agree to.'],
        ['Curiosity beats assumptions', 'Research on cycles shows wide differences in mood and energy between people. The most reliable way to know is to ask.'],
        ['Make room for independence', 'Closeness works best when both people have space for their own friends, interests and time. Encourage something that is just theirs.'],
        ['Repair what was left unsaid', 'If something was set aside during harder days, now may be a good time to revisit it calmly using “I” statements.'],
        ['Be a teammate on routines', 'Sharing routines for sleep, meals and movement supports wellbeing for both of you. Ask how you can make them easier, not stricter.'],
        ['Share in their wins', 'Ask about something your partner is proud of and listen fully. Being celebrated is part of feeling secure.'],
        ['Talk about intimacy openly', 'Desire varies between people, and across cycles for some. Ask openly about what feels good, and treat every answer as useful.'],
    ];

    private const OVULATORY = [
        ['Ovulation is an estimate, not a signal', 'Ovulation typically occurs about 12 to 16 days before the next period, and tracking apps can be wrong by several days. Never treat it as proof of how someone feels.'],
        ['Talk about contraception or conception', 'This is a good moment to check that you share the same plan. Fertility is highest in the few days around ovulation, so talk about it early and kindly.'],
        ['Consent is conversation', 'Desire cannot be predicted from a calendar, whatever the phase. Ask, listen and respect the answer.'],
    ];

    private const LUTEAL = [
        ['Early luteal days can feel calm', 'After ovulation, progesterone rises and the luteal phase usually lasts about 12 to 14 days. Many people feel fine early on, so keep plans warm and flexible.'],
        ['Sleep may be lighter', 'Body temperature is slightly higher after ovulation and some people sleep less deeply. Protect a calm evening instead of piling on plans.'],
        ['Cravings are normal', 'Appetite changes before a period are widely reported. Offering a snack they love, with no comment on food, is a simple act of care.'],
        ['Premenstrual symptoms are common', 'Many people notice some symptoms before a period, and a smaller share find them severe. Believe what your partner tells you about their experience.'],
        ['Do not say “it\'s hormones”', 'Feelings can be real and valid at any time of the month. Dismissing them as hormonal can make someone feel unheard; ask what is going on instead.'],
        ['Reduce friction where you can', 'Stress and poor sleep can make premenstrual symptoms feel stronger. Taking a small stressor off your partner\'s plate is practical support.'],
        ['Check, then check again', 'Mood changes may be mild, strong or absent. Ask once and mean it: “How are you doing today?”'],
        ['Hold your own boundaries too', 'Caring does not mean absorbing everything. If a conversation becomes heated, you can pause kindly and return to it later.'],
        ['Comfort can be simple', 'Warmth, quiet, a favourite show or a walk are often welcomed. Offer two options and let your partner choose.'],
        ['Disagreements can wait', 'If a discussion is not urgent, offer to pick it up when you both have energy. Postponing is not avoiding when you name a time.'],
        ['Know when to encourage help', 'A small proportion of people have PMDD, a severe form of premenstrual disorder. If distress is intense, support them in speaking to a clinician.'],
        ['Be steady as the period nears', 'Symptoms usually ease once bleeding begins. Keep supplies and comforts ready if that is something your partner wants.'],
        ['Cycles run late sometimes', 'Stress, travel and illness can shift timing. Avoid jumping to conclusions and keep your tone relaxed while you wait.'],
    ];

    private const UNKNOWN = [
        ['Ask what would help today', 'Cycle patterns vary a lot between people. A simple, specific question is more reliable than any calendar.'],
        ['Appreciation is a daily habit', 'Telling someone exactly what you value tends to strengthen trust. Name one thing today.'],
        ['Listen without fixing', 'Many people want to be heard before they want advice. Reflect back what you hear before suggesting anything.'],
        ['Share the load', 'Offer to take one task off your partner\'s plate and let them choose which one.'],
        ['Small rituals matter', 'A shared meal, a walk or a few minutes without phones can keep you connected through busy weeks.'],
        ['Check assumptions', 'It is easy to guess what another person is feeling and be wrong. Ask, then believe the answer.'],
        ['Rest is part of care', 'Good sleep supports mood and patience. Protect a calm evening for both of you.'],
        ['Say what you need, too', 'Healthy support runs both ways. Share a need clearly and kindly rather than hoping it will be noticed.'],
        ['Repair quickly', 'Disagreements are normal. A sincere “I\'m sorry, let me try again” often matters more than who was right.'],
        ['Notice the effort', 'Your partner may be doing more than they show. Acknowledge effort, not only results.'],
        ['Ask before offering advice', '“Do you want ideas or just company?” is a useful question for almost any hard day.'],
        ['Keep promises small and real', 'Reliability builds trust. Make small commitments you can keep and follow through.'],
        ['Respect privacy', 'Sharing is a choice. Receive what is shared with care and do not push for more.'],
        ['Share something light', 'Humour and play are protective in relationships. Send a kind message or an in-joke today.'],
        ['Check in on stress', 'Work and life stress often show up as short tempers. Ask how the week is really going.'],
        ['Be curious about their day', 'Ask a follow-up question about something they mentioned earlier. It shows you were listening.'],
        ['Make space for quiet', 'Some people need time alone to process. Offer it without taking it personally.'],
        ['Plan something to look forward to', 'Anticipation supports wellbeing. A small plan for the weekend can lift the week.'],
        ['Talk about health matters kindly', 'Offer to come to appointments or help with research when your partner wants it, without taking over.'],
        ['Practise gratitude together', 'Sharing one thing you are each grateful for takes under a minute and can shift the mood.'],
        ['Mind your tone', 'Tone carries as much as words. A softer start to a hard conversation often leads to a better ending.'],
        ['Offer comfort first', 'When someone is upset, physical or practical comfort often helps before any talking does.'],
        ['Learn together', 'Reading about cycles and bodies together can build understanding. Choose something neutral and factual.'],
        ['Celebrate progress', 'Notice growth in your relationship as well as problems. Name something that is better than it was.'],
        ['Share decisions', 'Where possible make choices together instead of presenting them finished. It shows respect.'],
        ['Look after yourself too', 'You will support your partner best when you are rested and fed. Take your own break without guilt.'],
        ['Let them lead the topic', 'Some days your partner will want to talk, and some days not. Follow their lead.'],
        ['Touch with permission', 'Affection is welcome on some days and overwhelming on others. Ask, and accept either answer.'],
        ['Express care in their language', 'Some people feel loved through words, others through help or time. Pay attention to what lands.'],
        ['Review how you handle conflict', 'Agree a pause signal for heated moments. It protects both of you.'],
        ['Be present', 'Put the phone away for a short while and give your full attention. It is simple and noticed.'],
    ];

    /** @return array{0:string,1:string} */
    public static function pick(string $phase, ?int $dayInPhase, int $dayOfMonth): array
    {
        $pool = match ($phase) {
            'menstrual' => self::MENSTRUAL,
            'follicular' => self::FOLLICULAR,
            'ovulatory-estimate', 'ovulatory' => self::OVULATORY,
            'luteal' => self::LUTEAL,
            default => self::UNKNOWN,
        };
        $index = $dayInPhase !== null && $phase !== 'cycle-unknown' ? $dayInPhase : $dayOfMonth - 1;
        return $pool[$index % count($pool)];
    }
}
