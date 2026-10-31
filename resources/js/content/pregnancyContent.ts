/**
 * Structured pregnancy education content.
 *
 * Every entry is educational, cites a named public source and carries a last-reviewed date and a disclaimer.
 * Add or revise content here, not in JSX. Entries apply to a gestational week (or an inclusive week range)
 * and, optionally, one exact gestational day within that week.
 */
export type ContentCategory = 'development' | 'milestone' | 'body' | 'wellbeing' | 'prenatal_care' | 'partner';
export type ContentSource = { name: string; url: string };
export type PregnancyContentEntry = {
    id: string;
    week: number | [number, number];
    day?: number;
    category: ContentCategory;
    heading: string;
    body: string;
    source: ContentSource;
    lastReviewed: string;
    disclaimer: string;
};

const NHS_WEEKS: ContentSource = { name: 'NHS · pregnancy week by week', url: 'https://www.nhs.uk/pregnancy/week-by-week/' };
const NHS_SYMPTOMS: ContentSource = { name: 'NHS · common pregnancy symptoms', url: 'https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/' };
const NHS_SCANS: ContentSource = { name: 'NHS · ultrasound scans in pregnancy', url: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/ultrasound-scans/' };
const NHS_MOVES: ContentSource = { name: 'NHS · your baby’s movements', url: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/' };
const NHS_WELL: ContentSource = { name: 'NHS · keeping well in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/' };
const ACOG: ContentSource = { name: 'ACOG · pregnancy', url: 'https://www.acog.org/womens-health/pregnancy' };
const WHO: ContentSource = { name: 'WHO · antenatal care recommendations', url: 'https://www.who.int/publications/i/item/9789241549912' };

export const REVIEWED = '2026-10-31';
export const GENERAL_DISCLAIMER = 'Educational information only. It cannot tell you whether your own pregnancy or baby is developing normally. Ask your maternity care team about anything that concerns you.';

const e = (id: string, week: PregnancyContentEntry['week'], category: ContentCategory, heading: string, body: string, source: ContentSource, extra: Partial<PregnancyContentEntry> = {}): PregnancyContentEntry =>
    ({ id, week, category, heading, body, source, lastReviewed: REVIEWED, disclaimer: GENERAL_DISCLAIMER, ...extra });

export const PREGNANCY_CONTENT: PregnancyContentEntry[] = [
    // Development, by week. Weeks without their own entry fall back to the closest earlier one and are labelled as ongoing.
    e('dev-0', [0, 3], 'development', 'Counting from your last period', 'Pregnancy weeks are usually counted from the first day of the last menstrual period, so in a typical cycle conception has not yet happened in these weeks. Dating can differ if your cycles vary or if a scan has revised your due date.', NHS_WEEKS),
    e('dev-4', 4, 'development', 'Implantation and the earliest cells', 'Around now the early ball of cells settles into the lining of the uterus. A pregnancy test may begin to turn positive, though timing varies from person to person.', NHS_WEEKS),
    e('dev-5', 5, 'development', 'Early structures are forming', 'The structures that will become the brain, spinal cord and heart begin to form. Ask your maternity care team which supplements are recommended for you.', NHS_WEEKS),
    e('dev-6', 6, 'development', 'The heart is developing', 'The heart is beginning to beat and tiny limb buds are appearing. Whether a heartbeat is seen on an early scan depends on exact dating and the scan type.', NHS_WEEKS),
    e('dev-8', 8, 'development', 'Fingers and toes are taking shape', 'Hands, feet and facial features continue to form, and the major organs are developing. The embryo is still very small; size comparisons are only illustrative.', NHS_WEEKS),
    e('dev-10', 10, 'development', 'The embryonic stage is ending', 'Vital organs have started to form. From around now the developing baby is called a fetus and growth becomes the main focus.', NHS_WEEKS),
    e('dev-12', 12, 'development', 'Growth and refinement', 'Fingernails and other fine features are developing and the baby is growing quickly. The first-trimester scan window is typically around now in many services.', NHS_WEEKS),
    e('dev-14', 14, 'development', 'The second trimester begins', 'The baby continues to grow and practise small movements, although most people cannot feel them yet. Energy levels often change in this trimester, but not for everyone.', NHS_WEEKS),
    e('dev-16', 16, 'development', 'Movements are starting', 'The baby is moving regularly, even if you cannot feel it. Many people first notice movements somewhere between about 16 and 25 weeks, and first pregnancies often fall later in that range.', NHS_MOVES),
    e('dev-18', 18, 'development', 'Sensory structures are developing', 'Structures involved in hearing and vision are continuing to develop. Your routine mid-pregnancy scan is commonly offered at around 18 to 21 weeks, depending on where you live.', NHS_SCANS),
    e('dev-20', 20, 'development', 'The halfway point', 'The baby is growing steadily and the mid-pregnancy scan checks how the baby is developing. You may also be able to ask about the placenta position at this scan.', NHS_SCANS),
    e('dev-22', 22, 'development', 'Fine details keep forming', 'Features such as eyebrows and fingernails continue to develop, and the baby’s movements may become easier to notice. Development is a continuing process, not a checklist.', NHS_WEEKS),
    e('dev-24', 24, 'development', 'Lungs are continuing to develop', 'The lungs keep developing throughout the rest of pregnancy. Baby’s movements may follow a recognisable pattern over the coming weeks.', NHS_WEEKS),
    e('dev-26', 26, 'development', 'Steady growth', 'The baby is gaining weight and continuing to mature. This is usually a time of steady rather than dramatic change.', NHS_WEEKS),
    e('dev-28', 28, 'development', 'The third trimester begins', 'The baby is growing quickly. Get to know your baby’s usual movement pattern; do not wait for a set number of movements. Contact your maternity team promptly if movements slow down, stop or change.', NHS_MOVES),
    e('dev-30', 30, 'development', 'Preparing for life outside', 'The baby continues to gain weight and the lungs and brain keep maturing. Space inside the uterus is getting tighter, so movements may feel different.', NHS_WEEKS),
    e('dev-32', 32, 'development', 'Growing and maturing', 'Many babies settle into a head-down position over the coming weeks, although some change position later. Your midwife can check position at appointments.', NHS_WEEKS),
    e('dev-34', 34, 'development', 'Continuing maturation', 'Organs, including the lungs, keep maturing. Many services encourage thinking about your birth preferences and the practical plans around them.', NHS_WEEKS),
    e('dev-36', 36, 'development', 'Getting ready', 'The baby may move lower into the pelvis. Your care team can discuss feeding choices, birth plans and signs of labour with you.', NHS_WEEKS),
    e('dev-37', 37, 'development', 'Early term', 'From 37 weeks a pregnancy is considered term, although the baby is still maturing. Continue to follow your care team’s advice about movements and symptoms.', NHS_WEEKS),
    e('dev-39', 39, 'development', 'Full term', 'The baby is considered full term from 39 weeks. Estimated due dates are not exact predictions and most babies arrive before or after them.', NHS_WEEKS),
    e('dev-40', 40, 'development', 'Around the estimated due date', 'Only a small proportion of babies arrive on the estimated due date. Ask your care team what to expect if you go past it.', NHS_WEEKS),
    e('dev-41', [41, 45], 'development', 'After the estimated due date', 'Your maternity team will talk with you about monitoring and your options if your pregnancy goes beyond the estimated due date.', NHS_WEEKS),

    // Milestones and routine care windows. These vary by service and are not clinical schedules.
    e('ms-12', [10, 14], 'milestone', 'A common first scan window', 'A dating scan is commonly offered somewhere between about 10 and 14 weeks. You can choose which screening tests to have.', NHS_SCANS),
    e('ms-20', [18, 21], 'milestone', 'A common mid-pregnancy scan window', 'The anomaly scan is commonly offered at about 18 to 21 weeks. It looks at the baby’s development, and cannot rule out every condition.', NHS_SCANS),
    e('ms-28', [28, 28], 'milestone', 'A good week to learn your baby’s pattern', 'From the third trimester, becoming familiar with your baby’s own movement pattern is the helpful part, not hitting a number.', NHS_MOVES),

    // Body changes.
    e('body-1', [0, 13], 'body', 'Early pregnancy can feel different for everyone', 'Tiredness, nausea, breast tenderness and mood changes are common in the first trimester, and some people have few symptoms. Neither is a sign about how the pregnancy is going.', NHS_SYMPTOMS),
    e('body-2', [14, 27], 'body', 'Body changes in the second trimester', 'You may notice changes in energy, skin, appetite, backache or round-ligament twinges as the uterus grows. Mention persistent pain to your care team.', NHS_SYMPTOMS),
    e('body-3', [28, 45], 'body', 'Body changes in the third trimester', 'Heartburn, backache, swelling, sleep disruption and Braxton Hicks tightenings are common late in pregnancy. Sudden or severe swelling, severe headache, or vision changes need prompt medical advice.', NHS_SYMPTOMS),

    // Daily wellbeing pool, selected by the actual gestational day.
    e('well-a', [0, 13], 'wellbeing', 'Small, regular meals', 'If nausea is part of your day, small regular meals and sips of fluid may feel easier than large ones. If you cannot keep fluids down, contact your maternity team.', NHS_SYMPTOMS),
    e('well-b', [0, 13], 'wellbeing', 'Rest is allowed', 'Early pregnancy tiredness is common. Lowering expectations for a day, or asking for practical help, is a reasonable response.', NHS_WELL),
    e('well-c', [0, 13], 'wellbeing', 'Questions for your next appointment', 'Jot down anything you want to ask about supplements, food safety, medicines you take, or screening choices.', WHO),
    e('well-d', [14, 27], 'wellbeing', 'Gentle movement', 'Moderate activity such as walking is usually encouraged in pregnancy if your clinician has not advised otherwise. Stop and seek advice if something feels wrong.', NHS_WELL),
    e('well-e', [14, 27], 'wellbeing', 'Notice what helps you sleep', 'Sleep can change as your body does. A pillow between the knees, a wind-down routine, and avoiding lying flat on your back later in pregnancy are common suggestions to discuss with your team.', NHS_WELL),
    e('well-f', [14, 27], 'wellbeing', 'Check in with your feelings', 'Pregnancy can bring worry as well as joy. If low mood or anxiety lasts or affects daily life, tell your midwife or doctor; support is available.', ACOG),
    e('well-g', [28, 45], 'wellbeing', 'Pace yourself', 'Late pregnancy can be physically demanding. Plan breaks, accept help, and keep appointment and hospital details somewhere easy to find.', NHS_WELL),
    e('well-h', [28, 45], 'wellbeing', 'Talk through your birth preferences', 'Your care team can explain pain-relief choices, who can be with you, and what to do when labour starts.', NHS_WELL),
    e('well-i', [28, 45], 'wellbeing', 'Know your baby’s movements', 'Notice your baby’s usual movements. If they reduce, stop or change, contact your maternity unit right away rather than waiting until the next day.', NHS_MOVES),

    // Prenatal care and partner suggestions.
    e('care-1', [0, 45], 'prenatal_care', 'Appointments are individual', 'The number and timing of appointments depends on your location, health history and pregnancy. Use your own clinic’s plan; windows shown here are not deadlines.', WHO),
    e('partner-1', [0, 45], 'partner', 'A way a partner can help today', 'Ask what would help instead of assuming: a meal, a lift to an appointment, quiet time, or just listening. They set the pace.', ACOG),
];

export const URGENT_SYMPTOM_GUIDANCE = {
    heading: 'When to seek urgent help',
    body: 'Contact your maternity unit, doctor or local emergency service straight away for heavy vaginal bleeding, severe or persistent abdominal pain, a severe headache that will not go away, vision changes, sudden face, hand or foot swelling, trouble breathing, chest pain, a seizure, fluid leaking from the vagina, or a baby who moves less than usual. This list is not complete, and Crescent cannot assess whether something is serious.',
    source: NHS_SYMPTOMS,
    lastReviewed: REVIEWED,
};

function covers(entry: PregnancyContentEntry, week: number): boolean {
    return Array.isArray(entry.week) ? week >= entry.week[0] && week <= entry.week[1] : entry.week === week;
}

export type DailyContent = {
    /** Entry written for exactly this week/day, if any. */
    exactDay: PregnancyContentEntry | null;
    /** Weekly overview; `isExactWeek` is false when the closest earlier entry is shown as ongoing development. */
    weekly: PregnancyContentEntry;
    isExactWeek: boolean;
    milestones: PregnancyContentEntry[];
    body: PregnancyContentEntry | null;
    wellbeing: PregnancyContentEntry | null;
    prenatalCare: PregnancyContentEntry | null;
    partner: PregnancyContentEntry | null;
};

/** Deterministic daily content, keyed on the real gestational week and day count. */
export function contentFor(week: number, gestationalDays: number): DailyContent {
    const w = Math.max(0, week);
    const day = gestationalDays % 7;
    const dev = PREGNANCY_CONTENT.filter(item => item.category === 'development');
    const exactWeek = dev.find(item => covers(item, w));
    const earlier = dev.filter(item => (Array.isArray(item.week) ? item.week[0] : item.week) <= w).pop();
    const weekly = exactWeek ?? earlier ?? dev[0];
    const wellbeingPool = PREGNANCY_CONTENT.filter(item => item.category === 'wellbeing' && covers(item, w));
    return {
        exactDay: PREGNANCY_CONTENT.find(item => covers(item, w) && item.day === day) ?? null,
        weekly,
        isExactWeek: Boolean(exactWeek),
        milestones: PREGNANCY_CONTENT.filter(item => item.category === 'milestone' && covers(item, w)),
        body: PREGNANCY_CONTENT.find(item => item.category === 'body' && covers(item, w)) ?? null,
        wellbeing: wellbeingPool.length ? wellbeingPool[gestationalDays % wellbeingPool.length] : null,
        prenatalCare: PREGNANCY_CONTENT.find(item => item.category === 'prenatal_care' && covers(item, w)) ?? null,
        partner: PREGNANCY_CONTENT.find(item => item.category === 'partner' && covers(item, w)) ?? null,
    };
}
