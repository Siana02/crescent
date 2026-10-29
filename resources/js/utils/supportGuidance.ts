export type PhaseKey = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

export type DailyGuidance = { title: string; summary: string; tip: string };
export type CareIdeas = { energy: string; drained: string; feelings: string };

const daily: DailyGuidance[] = [
    { title: 'Comfort first today', summary: 'Day 1 is often the heaviest and most uncomfortable. Period pain (dysmenorrhea) is very common, and many people also feel tired. Ask what would make today easier.', tip: 'Offer a heat pack, water and a lighter-than-usual to-do list.' },
    { title: 'Keep things flexible', summary: 'Bleeding commonly lasts 3–7 days. Cramps, headaches and low energy are common for some people, while others feel fine. Plans may need to bend.', tip: 'Offer to handle a meal or errand so they can rest if they want to.' },
    { title: 'Rest is productive', summary: 'Blood loss and disrupted sleep can add to tiredness in the first days of a period. Rest is not laziness.', tip: 'Suggest an early night or protect a slow, quiet evening.' },
    { title: 'Cosy, low-pressure company', summary: 'Hormone levels (oestrogen and progesterone) are at their lowest around now, and for many people discomfort starts easing from here. Everyone differs.', tip: 'Choose a calm shared activity like a film or a cosy takeaway.' },
    { title: 'Small gestures count', summary: 'Heavier bleeding can lower iron for some people, which may add to fatigue. Never comment on their food or energy—just be kind and practical.', tip: 'Ask if they would like a favourite meal or snack brought over.' },
    { title: 'Energy may be returning', summary: 'Oestrogen begins to rise after the period ends and many people feel lighter. Some do not notice any change, and that is normal too.', tip: 'Float a gentle idea, such as a short walk, and let them decide.' },
    { title: 'A fresh-start feeling', summary: 'Rising oestrogen is linked in research with improved mood and motivation for some people, though experiences vary a lot.', tip: 'Ask what they would like to do this week and make space for it.' },
    { title: 'Room for plans', summary: 'In the follicular phase an egg follicle is maturing in the ovary. The length of this phase is the most variable part of the cycle.', tip: 'Suggest a café date or a little outing if they feel up for it.' },
    { title: 'Follow their pace', summary: 'Cycle days are estimates. Cycles between about 21 and 35 days are considered typical for adults, so today\'s phase could be a little off.', tip: 'Check in rather than assuming how they feel.' },
    { title: 'Be curious, not predictive', summary: 'A calendar can only estimate how someone feels. Their own check-in is more reliable than a phase.', tip: 'Ask an open question: "How are you feeling today?"' },
    { title: 'Support their projects', summary: 'Many people report feeling more sociable or motivated mid-cycle, but research shows the pattern is inconsistent between people.', tip: 'Offer encouragement for something they are working on.' },
    { title: 'A good day for connection', summary: 'Quality time tends to matter more than grand gestures. Listening without fixing is often the most appreciated support.', tip: 'Plan an unhurried walk or a meal together, phone away.' },
    { title: 'Keep checking in', summary: 'Ovulation usually happens about 10–16 days before the next period, not necessarily on day 14. Estimates can be off by several days.', tip: 'Ask, don\'t assume, about plans and energy.' },
    { title: 'Around ovulation', summary: 'The fertile window is roughly six days: the five days before ovulation and ovulation day. The egg survives about 12–24 hours; sperm can survive up to five days.', tip: 'If you are avoiding or planning pregnancy, talk openly about it—this window is only an estimate.' },
    { title: 'Follow their lead', summary: 'Some people notice more energy, clearer cervical fluid or a change in desire around ovulation; others notice nothing at all.', tip: 'Let them set the tone for intimacy and plans.' },
    { title: 'Mild one-sided twinges are normal', summary: 'A minority of people feel a brief twinge on one side (mittelschmerz) around ovulation. Persistent or severe pain is worth a doctor\'s visit.', tip: 'Be kind if they feel off, and encourage medical advice for severe pain.' },
    { title: 'Progesterone rises now', summary: 'After ovulation progesterone climbs, and resting body temperature rises by roughly 0.3–0.5°C. This can affect sleep and feelings of warmth.', tip: 'Help with comfortable bedding or a cool drink without making a fuss.' },
    { title: 'Gentle early luteal days', summary: 'The luteal phase typically lasts about 10–16 days. Many people feel fine early on, with symptoms building toward the end.', tip: 'Keep plans light but welcome; ask what they feel like.' },
    { title: 'Sleep can shift', summary: 'Some people sleep more lightly in the luteal phase. Poor sleep can make everything feel harder, and is not personal.', tip: 'Protect a quiet evening and an easy bedtime routine.' },
    { title: 'Appetite may change', summary: 'Research shows energy needs can rise slightly in the luteal phase, so cravings and hunger are common and perfectly normal.', tip: 'Bring a snack they love—and say nothing about it.' },
    { title: 'Tiredness is common', summary: 'Fatigue is one of the most reported PMS symptoms. Up to about three in four people who menstruate notice at least some premenstrual symptoms.', tip: 'Take one chore off their plate today.' },
    { title: 'Feelings may feel bigger', summary: 'Mood changes such as irritability or sadness are reported by many people before a period. Don\'t take it personally or label it "hormones".', tip: 'Ask: "Do you want comfort, help solving it, or space?"' },
    { title: 'Bloating and tenderness', summary: 'Breast tenderness and bloating are common as the period approaches and typically ease once bleeding starts.', tip: 'Offer a hug only if wanted, and comfortable clothes-and-couch plans.' },
    { title: 'Patience goes a long way', summary: 'Stress and little sleep can make premenstrual symptoms feel stronger. Cutting down friction at home can help.', tip: 'Handle a small stressor before they have to ask.' },
    { title: 'Listen first', summary: 'Symptoms usually peak in the days just before bleeding. Being heard matters more than being advised.', tip: 'Listen fully before offering any solution.' },
    { title: 'Warmth and softness', summary: 'Gentle movement, warmth and good sleep are commonly suggested for easing PMS, though results differ between people.', tip: 'Offer a warm bath, tea or a heat pack.' },
    { title: 'Period may be near', summary: 'For most people symptoms begin to ease within a few days of bleeding starting. Cycle estimates can be a few days out.', tip: 'Keep period supplies, snacks and painkillers they like stocked, if they want that.' },
    { title: 'Prepare softly', summary: 'Only a small share of people (roughly 3–8%) have PMDD, a severe form of PMS. If distress is intense, encourage them to see a clinician.', tip: 'Let them know you are there, and that seeking help is okay.' },
    { title: 'Almost there', summary: 'Longer cycles are still normal. If the period is late, it may be due to stress, travel or illness, and it does not necessarily mean anything specific.', tip: 'Stay relaxed and supportive, with no pressure or guessing.' },
];

const ideas: Record<PhaseKey, CareIdeas[]> = {
    menstrual: [
        { energy: 'If {n} feels well, a slow stroll, a café or a cosy home date could be lovely. Let {n} choose the pace.', drained: 'Offer a heat pack, dinner, a favourite film and an early night.', feelings: 'Pain and tiredness can shorten patience. Listen, and ask if {n} wants comfort, practical help or space.' },
        { energy: 'Some people feel a lift mid-period. Ask if {n} would like fresh air or a small outing.', drained: 'Take over a chore and keep the evening quiet and warm.', feelings: 'Don\'t dismiss feelings as hormones. Stay curious and ask what would help.' },
    ],
    follicular: [
        { energy: 'Energy often rises now. Suggest a walk, a picnic, a class or a favourite café, if {n} fancies it.', drained: 'Even in a high-energy phase some days are slow. Offer dinner or a quiet night in.', feelings: 'Moods are not predictable by phase. Ask how {n} is feeling instead of guessing.' },
        { energy: 'Try something new together, like an exhibition, market or a new recipe. Let {n} lead.', drained: 'Help with admin or chores so {n} can recover.', feelings: 'Stay open and curious. Listening matters more than fixing.' },
    ],
    ovulatory: [
        { energy: 'Offer an outing, a date night or time with friends, if {n} wants it.', drained: 'No one feels the same every cycle. Offer rest and a calm evening if {n} wants one.', feelings: 'Feelings and desire vary widely. Ask, don\'t assume, what {n} feels like.' },
        { energy: 'A sunny walk or a spontaneous plan may suit {n}. Let {n} choose.', drained: 'Take a task off {n}\'s plate and offer an early night.', feelings: 'Check in kindly and respect whatever {n} says.' },
    ],
    luteal: [
        { energy: 'Ask whether {n} would enjoy a gentle walk, a favourite café or a picnic. Let {n} choose the pace.', drained: 'Offer dinner, a warm bath if {n} enjoys one, a favourite film, help with chores or a chance to sleep in.', feelings: 'Don\'t dismiss feelings as hormones or assume they\'re about you. Ask whether {n} wants comfort, practical help or space.' },
        { energy: 'Keep plans light and flexible, like a short stroll or a coffee date. Make it easy to say no.', drained: 'Handle dinner and tidying, and protect some quiet time and sleep for {n}.', feelings: 'Listen without debating or diagnosing. Offer a snack, a hug if wanted, or space.' },
        { energy: 'Suggest something cosy and low-key, like crafting, baking or a film. Ask what sounds good.', drained: 'Warm drinks, a heat pack and a slow evening can feel like a treat.', feelings: 'Patience, kindness and no "is it that time?" comments.' },
    ],
    unknown: [
        { energy: 'Ask whether {n} would enjoy a walk, a café or an outing together.', drained: 'Offer dinner, a warm bath, a film or a chance to sleep in.', feelings: 'Ask whether {n} wants comfort, practical help or space.' },
    ],
};

export function phaseFor(day: number | null): { key: PhaseKey; label: string } {
    if (!day || day < 1) return { key: 'unknown', label: 'Phase not available' };
    if (day <= 5) return { key: 'menstrual', label: 'Menstrual phase · estimated' };
    if (day <= 13) return { key: 'follicular', label: 'Follicular phase · estimated' };
    if (day <= 16) return { key: 'ovulatory', label: 'Around ovulation · estimated' };
    return { key: 'luteal', label: 'Luteal phase · estimated' };
}

export function dailyGuidance(day: number | null): DailyGuidance {
    if (!day || day < 1) return { title: 'Let them lead the rhythm', summary: 'Cycle timing is an estimate. Their own check-in is more useful than a calendar prediction.', tip: 'Ask what would feel supportive today.' };
    return daily[(day - 1) % daily.length];
}

export function careIdeasFor(day: number | null, name: string): CareIdeas {
    const set = ideas[phaseFor(day).key];
    const picked = set[Math.max(0, (day ?? 1) - 1) % set.length];
    const fill = (text: string) => text.replace(/\{n\}/g, name);
    return { energy: fill(picked.energy), drained: fill(picked.drained), feelings: fill(picked.feelings) };
}
