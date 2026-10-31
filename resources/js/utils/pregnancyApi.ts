export type CheckinDetails = {
    severity?: Record<string, number>;
    duration?: Record<string, string>;
    frequency?: Record<string, string>;
    sleep_quality?: string;
};
export type PregnancyCheckin = {
    log_date: string;
    symptoms: string[];
    mood: string | null;
    energy_level: string | null;
    notes: string | null;
    details?: CheckinDetails | Record<string, never>;
};
export type PregnancyReminder = {
    id: number; title: string; category: string; remind_at: string; notes: string | null;
    share_with_partner: boolean; completed_at: string | null; created_by_name?: string | null;
};

export const SYMPTOM_GROUPS: { title: string; items: [string, string][] }[] = [
    { title: 'Digestion', items: [['nausea', 'Nausea'], ['vomiting', 'Vomiting'], ['heartburn', 'Heartburn'], ['constipation', 'Constipation'], ['appetite_changes', 'Appetite changes'], ['food_aversions', 'Food aversions'], ['food_cravings', 'Food cravings']] },
    { title: 'Physical wellbeing', items: [['backache', 'Backache'], ['pelvic_discomfort', 'Pelvic discomfort'], ['headache', 'Headache'], ['breast_tenderness', 'Breast tenderness'], ['swelling', 'Swelling'], ['muscle_discomfort', 'Muscle discomfort']] },
    { title: 'Sleep and energy', items: [['fatigue', 'Fatigue'], ['insomnia', 'Insomnia'], ['sleep_changes', 'Sleep changes']] },
    { title: 'Emotional wellbeing', items: [['anxiety', 'Anxiety'], ['irritability', 'Irritability'], ['low_mood', 'Low mood'], ['feeling_overwhelmed', 'Feeling overwhelmed'], ['hopefulness', 'Hopefulness'], ['mood_changes', 'Emotional changes']] },
    { title: 'Pregnancy observations', items: [['movement_noticed', 'Baby movement noticed'], ['other_observation', 'Other observation']] },
];
export const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(SYMPTOM_GROUPS.flatMap(group => group.items));
export const REMINDER_CATEGORIES: [string, string][] = [
    ['appointment', 'Prenatal appointment'], ['scan', 'Scan'], ['medication', 'Medication'], ['class', 'Class'],
    ['shopping', 'Shopping & preparation'], ['wellbeing', 'Personal wellbeing'], ['support', 'Support arrangements'], ['other', 'Other'],
];

export function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

/** JSON request helper. Throws an Error carrying the server's message so callers can surface it. */
export async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(url, {
        method, credentials: 'same-origin',
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method === 'GET' ? {} : { 'X-CSRF-TOKEN': csrfToken() }) },
        body: body ? JSON.stringify(body) : undefined,
    });
    let data: { message?: string; errors?: Record<string, string[]> } & Record<string, unknown> = {};
    try { data = await response.json(); } catch { /* empty body */ }
    if (!response.ok) throw new Error((data.errors ? Object.values(data.errors)[0]?.[0] : data.message) || 'Something went wrong. Please try again.');
    return data as T;
}
