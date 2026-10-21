import { useState, type FormEvent } from 'react';
import Button from '../components/Button';
import { getMoonPhase } from '../utils/moonPhase';
import '../styles/pregnancy.css';

type PregnancyCheckin = {
    log_date: string;
    symptoms: string[];
    mood: string | null;
    energy_level: string | null;
    notes: string | null;
};
type PregnancySummary = {
    due_date: string;
    last_period_date: string | null;
    conception_date: string | null;
    due_date_source: string;
    wants_baby_astrology: boolean;
    status: string;
    gestational_week: number;
    gestational_day_in_week: number;
    gestational_days: number;
    trimester: number;
    days_until_due: number;
    today_checkin: PregnancyCheckin | null;
};
type PregnancyDashboardData = {
    user: { name: string; email: string };
    profile: { display_name: string | null; active_journey: string; wants_astrology: boolean };
    pregnancy: PregnancySummary | null;
};
type Props = {
    data: PregnancyDashboardData;
    onLogout: () => Promise<void>;
    onRefresh: () => Promise<void>;
};

const SYMPTOMS = [
    ['nausea', 'Nausea', '🌊'], ['fatigue', 'Fatigue', '☁️'],
    ['food_cravings', 'Food cravings', '🍓'], ['backache', 'Backache', '🌿'],
    ['heartburn', 'Heartburn', '🔥'], ['sleep_changes', 'Sleep changes', '🌙'],
    ['headache', 'Headache', '✨'], ['swelling', 'Swelling', '🫧'],
    ['mood_changes', 'Mood changes', '🌦️'], ['movement_noticed', 'Movement noticed · if applicable', '🦋'],
    ['constipation', 'Constipation', '🌸'], ['pelvic_discomfort', 'Pelvic discomfort', '🤍'],
] as const;
const MOODS = ['calm', 'happy', 'tender', 'anxious', 'overwhelmed', 'irritable', 'hopeful', 'tired'];
const ENERGIES = [{ value: 'low', label: 'Resting' }, { value: 'balanced', label: 'Steady' }, { value: 'high', label: 'Bright' }];

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}
function prettyDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
}
function sunSignForDate(value: string): string {
    const date = new Date(value + 'T12:00:00');
    const md = (date.getMonth() + 1) * 100 + date.getDate();
    if (md >= 321 && md <= 419) return 'Aries';
    if (md >= 420 && md <= 520) return 'Taurus';
    if (md >= 521 && md <= 620) return 'Gemini';
    if (md >= 621 && md <= 722) return 'Cancer';
    if (md >= 723 && md <= 822) return 'Leo';
    if (md >= 823 && md <= 922) return 'Virgo';
    if (md >= 923 && md <= 1022) return 'Libra';
    if (md >= 1023 && md <= 1121) return 'Scorpio';
    if (md >= 1122 && md <= 1221) return 'Sagittarius';
    if (md >= 1222 || md <= 119) return 'Capricorn';
    if (md >= 120 && md <= 218) return 'Aquarius';
    return 'Pisces';
}
function weekFocus(week: number): { title: string; copy: string } {
    if (week <= 4) return { title: 'The earliest chapter', copy: 'These early weeks can feel quiet or full of questions. Your maternity care team can help confirm dates and explain what is typical for your situation.' };
    if (week <= 8) return { title: 'Foundations are forming', copy: 'Early development is underway. Use prenatal appointments to understand the milestones and screening options that apply to you.' };
    if (week <= 13) return { title: 'A first-trimester chapter', copy: 'Energy and symptoms can change from day to day. Your notes are for your own reflection and conversations with your care team.' };
    if (week <= 20) return { title: 'A new stretch of growth', copy: 'Your pregnancy is moving through another chapter. Ask your care team which checks and milestones are relevant for your stage.' };
    if (week <= 27) return { title: 'Finding a new rhythm', copy: 'Comfort, sleep and energy may shift as pregnancy progresses. Keep notes about what you notice without comparing your experience with anyone else’s.' };
    if (week <= 32) return { title: 'The third-trimester chapter', copy: 'Your care team can guide you on movement guidance, upcoming appointments and practical preparations for birth.' };
    if (week <= 36) return { title: 'Preparing for arrival', copy: 'This can be a useful time to discuss birth preferences, support people and practical plans with your maternity care team.' };
    return { title: 'Your arrival window', copy: 'Estimated due dates are not exact predictions. If your due date has passed, follow your maternity care team’s guidance about next steps.' };
}

export default function PregnancyDashboard({ data, onLogout, onRefresh }: Props) {
    const pregnancy = data.pregnancy;
    const [symptoms, setSymptoms] = useState<string[]>(pregnancy?.today_checkin?.symptoms ?? []);
    const [mood, setMood] = useState(pregnancy?.today_checkin?.mood ?? '');
    const [energy, setEnergy] = useState(pregnancy?.today_checkin?.energy_level ?? '');
    const [notes, setNotes] = useState(pregnancy?.today_checkin?.notes ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [inviteType, setInviteType] = useState<'observer' | 'co_tracker'>('observer');
    const [inviteCode, setInviteCode] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const firstName = data.profile.display_name?.trim() || data.user.name.split(' ')[0] || 'there';

    async function saveCheckin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(''); setNotice('');
        if (!symptoms.length && !mood && !energy && !notes.trim()) {
            setError('Choose one little thing to log first.'); return;
        }
        setIsSaving(true);
        try {
            const response = await fetch('/api/pregnancy/checkins', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ symptoms, mood: mood || null, energy_level: energy || null, notes: notes.trim() || null }),
            });
            const result = await response.json() as { message?: string; errors?: Record<string, string[]> };
            if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0]?.[0] : result.message || 'Your check-in could not be saved.');
            setNotice(result.message || 'Your check-in is saved.');
            await onRefresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Your check-in could not be saved.');
        } finally { setIsSaving(false); }
    }

    async function createInvite(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError(''); setInviteCode(''); setIsInviting(true);
        try {
            const response = await fetch('/api/relationships/invite', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ relationship_type: inviteType }),
            });
            const result = await response.json() as { invite_code?: string; message?: string; errors?: Record<string, string[]> };
            if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0]?.[0] : result.message || 'We could not create an invitation.');
            setInviteCode(result.invite_code ?? '');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not create an invitation.');
        } finally { setIsInviting(false); }
    }

    async function transitionToPostpartum() {
        if (!window.confirm('Open your postpartum and newborn journal? Your pregnancy history will stay saved, and Crescent will stop showing pregnancy-stage estimates.')) return;
        setError(''); setIsTransitioning(true);
        try {
            const response = await fetch('/api/pregnancy/postpartum', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
            });
            const result = await response.json() as { message?: string };
            if (!response.ok) throw new Error(result.message || 'We could not open your postpartum space.');
            window.location.assign('/dashboard');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not open your postpartum space.');
            setIsTransitioning(false);
        }
    }

    if (!pregnancy) return <main className="pregnancy-empty"><div className="pregnancy-empty__moon">☾</div><p className="pregnancy-eyebrow">YOUR PREGNANCY JOURNEY</p><h1>Your space is almost ready</h1><p>We couldn’t find a saved pregnancy date. Return to onboarding to finish setting up your pregnancy journey.</p><Button onClick={() => window.location.assign('/onboarding')}>Finish my setup ✧</Button></main>;

    const week = pregnancy.gestational_week;
    const focus = weekFocus(week);
    const moonOnDueDate = getMoonPhase(new Date(pregnancy.due_date + 'T12:00:00'));
    const progress = Math.max(2, Math.min(100, Math.round((week / 40) * 100)));
    const daysCopy = pregnancy.days_until_due > 0
        ? 'About ' + pregnancy.days_until_due + ' day' + (pregnancy.days_until_due === 1 ? '' : 's') + ' until your estimated due date'
        : pregnancy.days_until_due === 0 ? 'Your estimated due date is today'
        : 'Your estimated due date has passed';

    return <div className="pregnancy-shell">
        <header className="pregnancy-header">
            <a className="pregnancy-brand" href="/" aria-label="Crescent home"><span>☾</span> crescent<span>.</span></a>
            <div className="pregnancy-header__actions"><span>A softer space for {firstName}</span><Button variant="outline" onClick={onLogout}>Sign out</Button></div>
        </header>
        <main className="pregnancy-main">
            <section className="pregnancy-hero">
                <div className="pregnancy-hero__sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>☾</span><span>❀</span></div>
                <p className="pregnancy-eyebrow">YOUR PREGNANCY UNIVERSE · A JOURNEY OF ITS OWN</p>
                <h1>Hello, {firstName}<em>Growing under the stars.</em></h1>
                <p className="pregnancy-hero__copy">This space follows your pregnancy journey — not a period countdown. Your dates, body and story deserve their own chapter.</p>
                <div className="pregnancy-hero__chips"><span>Trimester {pregnancy.trimester}</span><span>{daysCopy}</span></div>
            </section>

            <section className="pregnancy-overview">
                <article className="pregnancy-week-card">
                    <div className="pregnancy-week-ring" style={{ background: 'conic-gradient(#a78bb4 ' + progress + '%, #eee4f0 0)' }}><div><strong>{week}</strong><span>WEEK</span></div></div>
                    <div className="pregnancy-week-card__copy"><p className="pregnancy-eyebrow">YOUR PREGNANCY, RIGHT NOW</p><h2>Week {week}, day {pregnancy.gestational_day_in_week}</h2><p>{focus.title}</p><small>{focus.copy}</small></div>
                </article>
                <article className="pregnancy-due-card"><span aria-hidden="true">🌷</span><p className="pregnancy-eyebrow">YOUR ESTIMATED DUE DATE</p><strong>{prettyDate(pregnancy.due_date)}</strong><p>{daysCopy}</p><small>Dates are estimates, not promises. Your maternity care team may revise your due date.</small><a className="pregnancy-edit-link" href="/onboarding?journey=pregnancy">Update dates or cosmic preferences ↗</a></article>
            </section>

            <section className="pregnancy-week-guide">
                <div><p className="pregnancy-eyebrow">A LITTLE WEEK-BY-WEEK SPACE</p><h2>{focus.title}</h2><p>{focus.copy}</p></div>
                <div className="pregnancy-week-guide__seal"><span aria-hidden="true">✧</span><strong>{week <= 13 ? 'FIRST' : week <= 27 ? 'SECOND' : 'THIRD'} TRIMESTER</strong><small>One week at a time</small></div>
            </section>

            {pregnancy.wants_baby_astrology && <section className="pregnancy-cosmos">
                <div className="pregnancy-cosmos__intro"><p className="pregnancy-eyebrow">THE STAR CHILD KEEPSAKE</p><h2>A sky snapshot for the date you’re dreaming of</h2><p>A playful look at the sky around your estimated due date — not a prediction of the actual birth chart.</p></div>
                <div className="pregnancy-cosmos__cards">
                    <article><span className="pregnancy-cosmos__icon">{sunSignForDate(pregnancy.due_date)}</span><small>Possible Sun sign if born on the due date</small><strong>{sunSignForDate(pregnancy.due_date)}</strong></article>
                    <article><span className="pregnancy-cosmos__icon">{moonOnDueDate.symbol}</span><small>Approximate moon phase on the due date</small><strong>{moonOnDueDate.name}</strong></article>
                </div>
                <p className="pregnancy-cosmos__disclaimer">The actual birth date, time and place affect a birth chart. Due dates can change, and astrology is for enjoyment rather than medical or developmental guidance.</p>
            </section>}

            <section className="pregnancy-checkin-section">
                <div className="pregnancy-section-heading"><p className="pregnancy-eyebrow">YOUR DAILY LITTLE CHECK-IN</p><h2>How are you feeling today?</h2><p>Log only what feels useful. There are no perfect answers here.</p></div>
                <form className="pregnancy-checkin" onSubmit={saveCheckin}>
                    <fieldset><legend>Anything you’ve noticed? <small>Choose any that fit today.</small></legend><div className="pregnancy-symptom-grid">{SYMPTOMS.map(([value, label, icon]) => <button type="button" key={value} aria-pressed={symptoms.includes(value)} className={symptoms.includes(value) ? 'pregnancy-symptom is-selected' : 'pregnancy-symptom'} onClick={() => setSymptoms(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])}><span aria-hidden="true">{icon}</span><strong>{label}</strong><i aria-hidden="true">{symptoms.includes(value) ? '✦' : '+'}</i></button>)}</div></fieldset>
                    <fieldset><legend>Your mood, in your own words</legend><div className="pregnancy-mood-row">{MOODS.map(item => <button type="button" key={item} aria-pressed={mood === item} className={mood === item ? 'pregnancy-mood is-selected' : 'pregnancy-mood'} onClick={() => setMood(current => current === item ? '' : item)}>{item}</button>)}</div></fieldset>
                    <fieldset><legend>Your energy</legend><div className="pregnancy-energy-row">{ENERGIES.map(item => <button type="button" key={item.value} aria-pressed={energy === item.value} className={energy === item.value ? 'pregnancy-energy is-selected' : 'pregnancy-energy'} onClick={() => setEnergy(current => current === item.value ? '' : item.value)}>{item.label}</button>)}</div></fieldset>
                    <label className="pregnancy-notes">A note to your future self <small>Optional · up to 1,000 characters</small><textarea rows={3} maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Anything you want to remember, ask about, or celebrate…" /></label>
                    {error && <p className="pregnancy-alert" role="alert">{error}</p>}{notice && <p className="pregnancy-notice" role="status">{notice}</p>}
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Tucking your note away…' : 'Save today’s check-in ✧'}</Button>
                </form>
            </section>

            <section className="pregnancy-companion">
                <div><p className="pregnancy-eyebrow">YOUR PEOPLE, YOUR CHOICE</p><h2>Invite someone into this chapter</h2><p>You can begin solo and invite a partner or companion whenever you’re ready. Connecting never switches sharing on automatically.</p></div>
                <form onSubmit={createInvite}><label>Choose a companion role<select value={inviteType} onChange={event => setInviteType(event.target.value as 'observer' | 'co_tracker')}><option value="observer">Partner or observer</option><option value="co_tracker">Co-tracking companion</option></select></label><Button type="submit" disabled={isInviting}>{isInviting ? 'Creating code…' : 'Create a Cosmic Sync Code ✧'}</Button></form>
                {inviteCode && <div className="pregnancy-invite-code"><small>Your invitation code</small><strong>{inviteCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copy code</button><span>Expires in seven days. Your details stay private until you choose to share.</span></div>}
            </section>

            <section className="pregnancy-transition">
                <div><p className="pregnancy-eyebrow">WHEN YOUR CHAPTER CHANGES</p><h2>Make room for the next little universe</h2><p>When your baby has arrived, you can choose to move into a postpartum and newborn journal. Crescent will never switch you automatically, and your pregnancy history will stay saved.</p></div>
                <Button type="button" variant="outline" disabled={isTransitioning} onClick={transitionToPostpartum}>{isTransitioning ? 'Preparing your next chapter…' : 'My baby has arrived · open postpartum space'}</Button>
            </section>
            <p className="pregnancy-medical-note">Crescent is a personal journal, not a medical device or a substitute for prenatal care. Symptom logs do not assess risk or diagnose conditions. If a symptom worries you or feels urgent, contact your maternity care team or local emergency service.</p>
        </main>
        <footer className="pregnancy-footer"><span>crescent. · one week, one moment, one breath at a time</span><a href="/">Back to the beginning ↑</a></footer>
    </div>;
}
