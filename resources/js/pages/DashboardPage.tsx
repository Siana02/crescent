import { useEffect, useState, type FormEvent } from 'react';
import Button from '../components/Button';
import { getMoonPhase } from '../utils/moonPhase';
import '../styles/personalization.css';

type Sign = 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';
type Goal = 'track_cycle' | 'predict_moon' | 'manage_symptoms' | 'cosmic_cycle' | 'fertility_support';
type Regularity = 'regular' | 'irregular' | 'unknown';
type DashboardData = {
    user: { name: string; email: string };
    profile: {
        average_cycle_length: number | null; average_period_length: number | null;
        cycle_regularity: Regularity; timezone: string; birth_date: string | null;
        contraception_type: string | null; primary_goal: Goal; birth_time: string | null;
        birth_place: string | null; sun_sign: Sign | null; moon_sign: Sign | null;
        rising_sign: Sign | null; onboarding_completed: boolean;
        display_name: string | null; wants_astrology: boolean; partner_preference: 'solo' | 'observer' | 'co_tracker';
    };
    latest_period: { start_date: string; end_date: string | null } | null;
    cycle_day: number | null; estimated_next_period: string | null; days_until_estimate: number | null;
    fertility_window: { ovulation_date: string; start_date: string; end_date: string } | null;
    today_checkin: { log_date: string; energy_level: string | null; mood: string | null; symptoms: string[]; notes: string | null } | null;
};
type ApiError = { message?: string; errors?: Record<string, string[]>; profile?: DashboardData['profile'] };
const SIGNS: Sign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SYMPTOMS = [
    ['cramps', 'Cramps'], ['bloating', 'Bloating'], ['headache', 'Headache'],
    ['tender_breasts', 'Tender breasts'], ['acne', 'Breakouts'], ['fatigue', 'Fatigue'],
    ['radiant_skin', 'Radiant skin'], ['backache', 'Backache'], ['nausea', 'Nausea'],
] as const;
const MOODS = ['calm', 'irritated', 'intuitive', 'anxious', 'happy', 'tender', 'focused', 'overwhelmed'];
const ENERGY = [{value:'low',label:'Low'}, {value:'balanced',label:'Balanced'}, {value:'high',label:'High'}, {value:'peak',label:'Peak'}];

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}
function localDateInputValue(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function formatDate(date: string | null | undefined): string {
    if (!date) return 'Not logged yet';
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}
function estimateCaption(days: number | null): string {
    if (days === null) return 'Add a period start date and a known cycle length to unlock an estimate.';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} past this estimate`;
    if (days === 0) return 'Estimated for today';
    return `About ${days} day${days === 1 ? '' : 's'} from now`;
}
function firstError(result: ApiError, fallback: string): string {
    return (result.errors ? Object.values(result.errors)[0]?.[0] : undefined) ?? result.message ?? fallback;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [lastPeriodStart, setLastPeriodStart] = useState('');
    const [lastPeriodEnd, setLastPeriodEnd] = useState('');
    const [averageCycleLength, setAverageCycleLength] = useState('');
    const [averagePeriodLength, setAveragePeriodLength] = useState('');
    const [cycleRegularity, setCycleRegularity] = useState<Regularity>('unknown');
    const [birthDate, setBirthDate] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [wantsAstrology, setWantsAstrology] = useState(false);
    const [contraception, setContraception] = useState('prefer_not_to_say');
    const [goal, setGoal] = useState<Goal>('track_cycle');
    const [birthTime, setBirthTime] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [moonSign, setMoonSign] = useState('');
    const [risingSign, setRisingSign] = useState('');
    const [energy, setEnergy] = useState('');
    const [mood, setMood] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [checkinNotes, setCheckinNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [checkinNotice, setCheckinNotice] = useState('');
    const moon = getMoonPhase();
    const periodMoon = data?.latest_period ? getMoonPhase(new Date(data.latest_period.start_date + 'T12:00:00')) : null;
    const moonArchetype = periodMoon?.name === 'New moon' ? 'White Moon' : periodMoon?.name === 'Full moon' ? 'Red Moon' : ['First quarter', 'Last quarter'].includes(periodMoon?.name ?? '') ? 'Quarter Moon' : periodMoon ? 'Crescent / Gibbous Moon' : null;
    const sunElement = data?.profile.sun_sign
        ? (['Aries', 'Leo', 'Sagittarius'].includes(data.profile.sun_sign) ? 'Fire' : ['Taurus', 'Virgo', 'Capricorn'].includes(data.profile.sun_sign) ? 'Earth' : ['Gemini', 'Libra', 'Aquarius'].includes(data.profile.sun_sign) ? 'Air' : 'Water')
        : null;

    async function loadDashboard() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const response = await fetch(`/api/dashboard?timezone=${encodeURIComponent(timezone)}`, {
            credentials: 'same-origin', headers: { Accept: 'application/json' },
        });
        if (response.status === 401) { window.location.assign('/login'); return; }
        if (!response.ok) throw new Error('We could not open your dashboard. Please refresh and try again.');
        const result = (await response.json()) as DashboardData;
        setData(result);
        setLastPeriodStart(result.latest_period?.start_date ?? '');
        setLastPeriodEnd(result.latest_period?.end_date ?? '');
        setAverageCycleLength(result.profile.average_cycle_length == null ? '' : String(result.profile.average_cycle_length));
        setAveragePeriodLength(result.profile.average_period_length == null ? '' : String(result.profile.average_period_length));
        setCycleRegularity(result.profile.cycle_regularity ?? 'unknown');
        setBirthDate(result.profile.birth_date ?? '');
        setDisplayName(result.profile.display_name ?? '');
        setWantsAstrology(result.profile.wants_astrology ?? false);
        setContraception(result.profile.contraception_type ?? 'prefer_not_to_say');
        setGoal(result.profile.primary_goal ?? 'track_cycle');
        setBirthTime(result.profile.birth_time?.slice(0, 5) ?? '');
        setBirthPlace(result.profile.birth_place ?? '');
        setMoonSign(result.profile.moon_sign ?? '');
        setRisingSign(result.profile.rising_sign ?? '');
        setEnergy(result.today_checkin?.energy_level ?? '');
        setMood(result.today_checkin?.mood ?? '');
        setSymptoms(result.today_checkin?.symptoms ?? []);
        setCheckinNotes(result.today_checkin?.notes ?? '');
    }

    useEffect(() => {
        loadDashboard().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Something went wrong.'))
            .finally(() => setIsLoading(false));
    }, []);

    async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setIsSaving(true); setError(''); setNotice('');
        if (lastPeriodEnd && !lastPeriodStart) {
            setError('Add the period start date too, or leave both period dates blank.'); setIsSaving(false); return;
        }
        if (lastPeriodStart && lastPeriodEnd && lastPeriodEnd < lastPeriodStart) {
            setError('Your period end date cannot be before its start date.'); setIsSaving(false); return;
        }
        const headers = { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() };
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        try {
            const profileResponse = await fetch('/api/cycle-profile', {
                method: 'PUT', credentials: 'same-origin', headers,
                body: JSON.stringify({
                    average_cycle_length: averageCycleLength ? Number(averageCycleLength) : null,
                    average_period_length: averagePeriodLength ? Number(averagePeriodLength) : null,
                    cycle_regularity: cycleRegularity, timezone,
                    birth_date: birthDate || null, contraception_type: contraception || null, primary_goal: goal,
                    wants_astrology: wantsAstrology, display_name: displayName.trim() || null,
                    birth_time: birthTime || null, birth_place: birthPlace.trim() || null,
                    moon_sign: moonSign || null, rising_sign: risingSign || null, onboarding_completed: true,
                }),
            });
            const profileResult = (await profileResponse.json()) as ApiError;
            if (!profileResponse.ok) throw new Error(firstError(profileResult, 'Could not save your personal details.'));
            if (lastPeriodStart) {
                const periodResponse = await fetch('/api/periods', {
                    method: 'POST', credentials: 'same-origin', headers,
                    body: JSON.stringify({ start_date: lastPeriodStart, end_date: lastPeriodEnd || null }),
                });
                const periodResult = (await periodResponse.json()) as ApiError;
                if (!periodResponse.ok) throw new Error(firstError(periodResult, 'Could not save your period dates.'));
            }
            await loadDashboard();
            setNotice('Your details are saved in your private Crescent space. ✨');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not save your details. Please try again.');
        } finally { setIsSaving(false); }
    }

    async function handleCheckin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setIsCheckingIn(true); setError(''); setCheckinNotice('');
        try {
            const response = await fetch('/api/daily-checkins', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ energy_level: energy || null, mood: mood || null, symptoms, notes: checkinNotes.trim() || null }),
            });
            const result = (await response.json()) as ApiError;
            if (!response.ok) throw new Error(firstError(result, 'Your check-in could not be saved.'));
            await loadDashboard();
            setCheckinNotice('Little check-in, safely tucked away. ✨');
        } catch (e) { setError(e instanceof Error ? e.message : 'Your check-in could not be saved.'); }
        finally { setIsCheckingIn(false); }
    }

    async function handleLogout() {
        try {
            await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() } });
        } finally { window.location.assign('/'); }
    }

    if (isLoading) return <main className="dashboard-loading" aria-live="polite">Opening your little universe…</main>;
    const estimatedDate = data?.estimated_next_period ?? null;
    const usesHormonalContraception = ['pill', 'hormonal_iud', 'implant', 'injection', 'patch', 'ring'].includes(data?.profile.contraception_type ?? '');
    const firstName = data?.profile.display_name?.trim() || data?.user.name.split(' ')[0] || 'there';
    const needsOnboarding = !data?.profile.onboarding_completed;
    const goalCopy: Record<Goal, string> = {
        track_cycle: 'A gentle place to notice patterns, learn your rhythm, and keep the details in one private place.',
        predict_moon: 'Your sky notes and cycle estimates live side by side here — as reflection, not a rulebook.',
        manage_symptoms: 'Your daily check-ins can help you notice your own patterns and bring useful notes to a care appointment if you choose.',
        cosmic_cycle: 'Your cycle and the cosmos, side by side — with astrology always on your terms.',
        fertility_support: 'Cycle awareness and gentle estimates to support your fertility journey, without treating predictions as guarantees.',
    };

    return (
        <div className="dashboard-shell">
            <header className="dashboard-header">
                <a className="dashboard-brand" href="/" aria-label="Crescent home"><span className="dashboard-brand__moon" aria-hidden="true">☾</span><span className="dashboard-brand__word">crescent<span>.</span></span></a>
                <div className="dashboard-header__actions">
                    <span className="dashboard-greeting">A little space for {firstName}</span>
                    <Button variant="outline" className="dashboard-logout" onClick={handleLogout}>Sign out</Button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-intro">
                    <p className="dashboard-eyebrow">YOUR PERSONAL CYCLE SPACE · MADE FOR YOU</p>
                    <h1>Hello, {firstName}<em>Let’s check in.</em></h1>
                    <p>{goalCopy[data?.profile.primary_goal ?? 'track_cycle']}</p>
                </div>

                {error && <p className="dashboard-alert" role="alert">{error}</p>}
                {notice && <p className="dashboard-notice" role="status">{notice}</p>}

                <section className="dashboard-cards" aria-label="Your cycle overview">
                    <article className="dashboard-card dashboard-card--cycle">
                        <p className="dashboard-card__eyebrow"><span aria-hidden="true">♡</span> YOUR CYCLE</p>
                        <p className="dashboard-card__metric">{data?.cycle_day ? `Day ${data.cycle_day}` : 'Your story starts here'}</p>
                        <p className="dashboard-card__description">{data?.latest_period ? `Last period began ${formatDate(data.latest_period.start_date)}.` : 'Add your most recent period dates below whenever you feel ready.'}</p>
                        <p className="dashboard-card__footnote">Your cycle is personal; estimates can vary from month to month.</p>
                    </article>
                    <article className="dashboard-card dashboard-card--estimate">
                        <p className="dashboard-card__eyebrow"><span aria-hidden="true">✧</span> {usesHormonalContraception ? 'NEXT BLEED ESTIMATE' : 'NEXT PERIOD ESTIMATE'}</p>
                        <p className="dashboard-card__metric dashboard-card__metric--date">{formatDate(estimatedDate)}</p>
                        <p className="dashboard-card__description">{estimateCaption(data?.days_until_estimate ?? null)}</p>
                        {estimatedDate && <div className="cycle-countdown" aria-label="Estimated cycle progress"><span style={{width: `${Math.max(0, Math.min(100, 100 - Math.max(0, data?.days_until_estimate ?? 0) / Math.max(1, data?.profile.average_cycle_length ?? 28) * 100))}%`}} /></div>}
                        <p className="dashboard-card__footnote">{usesHormonalContraception ? 'Bleeding can change on hormonal contraception, so a natural-cycle estimate is not shown.' : 'An estimate based on the information you’ve logged, not a guarantee.'}</p>
                    </article>
                    {data?.profile.wants_astrology && <article className="dashboard-card dashboard-card--moon">
                        <p className="dashboard-card__eyebrow"><span aria-hidden="true">☾</span> TONIGHT’S SKY NOTE</p>
                        <div className="moon-phase-display"><span className="moon-phase-display__symbol" aria-hidden="true">{moon.symbol}</span><div><p className="moon-phase-display__name">{moon.name}</p><p className="moon-phase-display__caption">Approximate lunar phase</p></div></div>
                        <p className="dashboard-card__description">A small invitation to pause, look up, and notice how you feel — without needing the sky to explain it.</p>
                        <p className="dashboard-card__footnote">Lunar phases are for cosmic curiosity, not cycle prediction.</p>
                    </article>}
                </section>

                {usesHormonalContraception && <p className="hormonal-note">♡ Hormonal contraception can suppress or change ovulation. Crescent focuses on bleeding logs and daily wellbeing here, rather than assuming a natural ovulation pattern.</p>}

                {data?.fertility_window && !usesHormonalContraception && <section className="fertility-note"><p className="dashboard-eyebrow">YOUR ESTIMATED FERTILE WINDOW</p><h2>A gentle cycle-awareness note</h2><div className="fertility-note__dates"><span>Window: {formatDate(data.fertility_window.start_date)} – {formatDate(data.fertility_window.end_date)}</span><span>Estimated ovulation: {formatDate(data.fertility_window.ovulation_date)}</span></div><p className="fertility-note__warning">These dates are estimates, not “safe days” or reliable contraception. Ovulation can shift, especially with irregular cycles. Use a reliable contraceptive method if avoiding pregnancy is important.</p></section>}

                {data?.profile.wants_astrology && <section className="cosmic-note">
                    <div className="cosmic-note__star" aria-hidden="true">✧</div>
                    <div><p className="dashboard-card__eyebrow">A NOTE FROM THE COSMOS</p>
                        <h2>{data?.profile.sun_sign ? `A little ${data.profile.sun_sign} energy` : 'Make room for your own kind of magic'}</h2>
                        <p>{data?.profile.sun_sign
                            ? `Your Sun sign is ${data.profile.sun_sign}. Let it be a playful reflection prompt, not a box to fit inside. What do you want to give yourself permission to feel today?`
                            : 'Add your birthday in your personal details to reveal your Sun sign. Birth time and place are optional, and you can leave any detail blank.'}</p>
                        <div className="astro-chips">
                            <span>☼ Sun: {data?.profile.sun_sign ?? 'Not set'}</span>
                            <span>☾ Moon: {data?.profile.moon_sign ?? 'Not set'}</span>
                            <span>↗ Rising: {data?.profile.rising_sign ?? 'Not set'}</span>
                        </div>
                        {moonArchetype && <div className="archetype-note"><span aria-hidden="true">☾</span><div><strong>Your moon-cycle archetype: {moonArchetype}</strong><p>Your last logged period began under an approximate {periodMoon?.name.toLowerCase()} moon. Some spiritual traditions give these phases symbolic names; treat this as a playful reflection, not a personality label or a biological pattern.</p></div></div>}
                        {sunElement && <div className="element-note"><span className="element-note__symbol" aria-hidden="true">{sunElement === 'Fire' ? '♨' : sunElement === 'Earth' ? '❋' : sunElement === 'Air' ? '〰' : '≈'}</span><div><strong>Your elemental reflection · {sunElement}</strong><p>{sunElement === 'Fire' ? 'What would it feel like to channel your spark into one thing that matters today?' : sunElement === 'Earth' ? 'A small grounding ritual: soften your shoulders, drink some water, and choose one gentle priority.' : sunElement === 'Air' ? 'Give your thoughts a little room to move. A journal page or fresh-air pause may help.' : 'Make space for softness without asking yourself to explain every feeling.'}</p></div></div>}
                    </div>
                </section>}

                <div className="dashboard-lower-grid">
                    <section className="checkin-panel">
                        <div className="panel-heading"><p className="dashboard-eyebrow">A MOMENT FOR YOU</p><h2>Your daily vibe check</h2><p>No right answers. Just a little snapshot of today.</p></div>
                        <form className="vibe-form" onSubmit={handleCheckin}>
                            <fieldset><legend>How’s your energy?</legend><div className="choice-row">
                                {ENERGY.map(option => <button type="button" key={option.value} className={energy === option.value ? 'choice-chip is-selected' : 'choice-chip'} aria-pressed={energy === option.value} onClick={() => setEnergy(energy === option.value ? '' : option.value)}>{option.label}</button>)}
                            </div></fieldset>
                            <fieldset><legend>What’s the mood?</legend><div className="choice-row">
                                {MOODS.map(option => <button type="button" key={option} className={mood === option ? 'choice-chip is-selected' : 'choice-chip'} aria-pressed={mood === option} onClick={() => setMood(mood === option ? '' : option)}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>)}
                            </div></fieldset>
                            <fieldset><legend>Anything you’re noticing in your body?</legend><div className="symptom-grid">
                                {SYMPTOMS.map(([value, label]) => <label key={value} className={symptoms.includes(value) ? 'symptom-option is-selected' : 'symptom-option'}><input type="checkbox" checked={symptoms.includes(value)} onChange={() => setSymptoms(old => old.includes(value) ? old.filter(item => item !== value) : [...old, value])}/><span>{label}</span></label>)}
                            </div></fieldset>
                            <label className="note-label">A note to future you <span>(optional)</span><textarea rows={3} maxLength={1000} value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)} placeholder="Anything you want to remember about today…" /></label>
                            <Button type="submit" disabled={isCheckingIn}>{isCheckingIn ? 'Saving your check-in…' : data?.today_checkin ? 'Update today’s check-in' : 'Save today’s check-in'} <span aria-hidden="true">✧</span></Button>
                            {checkinNotice && <p className="dashboard-notice" role="status">{checkinNotice}</p>}
                            <p className="cycle-settings__privacy">Private to your account. You can skip any part; choose at least one item to save.</p>
                        </form>
                    </section>

                    <section className="cycle-settings">
                        <div className="cycle-settings__intro">
                            <p className="dashboard-eyebrow">{needsOnboarding ? 'LET’S MAKE THIS YOURS' : 'YOUR DETAILS, YOUR WAY'}</p>
                            <h2>{needsOnboarding ? 'A little about you.' : 'Your personal details'}</h2>
                            <p>{needsOnboarding ? 'Share what you know. “I don’t know” is a perfectly good answer, and you can update anything later.' : 'Change these whenever your needs change. Optional means optional.'}</p>
                            <div className="privacy-note"><span aria-hidden="true">✧</span><p>These details belong to your account. Crescent will never treat astrology as medical advice.</p></div>
                        </div>
                        <form className="cycle-settings__form" onSubmit={handleSaveProfile}>
                            <div className="form-subheading">Your cycle</div>
                            <label>When did your last period start?
                                <input type="date" value={lastPeriodStart} max={localDateInputValue()} onChange={e => setLastPeriodStart(e.target.value)} />
                            </label>
                            <label>When did it end? <span className="field-hint">Leave blank if it’s still going or you’re not sure.</span>
                                <input type="date" value={lastPeriodEnd} min={lastPeriodStart || undefined} max={localDateInputValue()} onChange={e => setLastPeriodEnd(e.target.value)} />
                            </label>
                            <label>How would you describe your cycle?
                                <select value={cycleRegularity} onChange={e => setCycleRegularity(e.target.value as Regularity)}><option value="regular">Usually regular</option><option value="irregular">Irregular / varies</option><option value="unknown">I don’t know yet</option></select>
                            </label>
                            <div className="cycle-settings__number-fields">
                                <label>Usual cycle length <span className="field-hint">Days between period starts</span><div className="number-input-wrap"><input type="number" min={21} max={45} value={averageCycleLength} onChange={e => setAverageCycleLength(e.target.value)} placeholder="I don’t know" /><span>days</span></div><span className="field-hint">Leave blank if you don’t know (21–45 days if known).</span></label>
                                <label>Usual period length <span className="field-hint">Days you usually bleed</span><div className="number-input-wrap"><input type="number" min={1} max={10} value={averagePeriodLength} onChange={e => setAveragePeriodLength(e.target.value)} placeholder="I don’t know" /><span>days</span></div><span className="field-hint">Leave blank if you don’t know.</span></label>
                            </div>
                            <label>Contraception <span className="field-hint">Optional — this can affect how useful cycle estimates are.</span>
                                <select value={contraception} onChange={e => setContraception(e.target.value)}><option value="prefer_not_to_say">Prefer not to say / not sure</option><option value="none">None</option><option value="pill">Pill</option><option value="hormonal_iud">Hormonal IUD</option><option value="copper_iud">Copper IUD</option><option value="implant">Implant</option><option value="injection">Injection</option><option value="patch">Patch</option><option value="ring">Vaginal ring</option><option value="other">Other</option></select>
                            </label>
                            <div className="form-subheading">Your Crescent experience</div>
                            <label>Display name <span className="field-hint">Your chosen name for your dashboard.</span><input type="text" maxLength={100} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name or nickname" /></label>
                            <label>What brings you here?
                                <select value={goal} onChange={e => { const next = e.target.value as Goal; setGoal(next); if (next === 'cosmic_cycle') setWantsAstrology(true); }}><option value="track_cycle">Track my cycle and understand my patterns</option><option value="cosmic_cycle">Cycle tracking + astrology</option><option value="fertility_support">Fertility awareness</option><option value="predict_moon">Explore moon phases and cosmic rituals</option><option value="manage_symptoms">Keep track of symptoms and how I feel</option></select>
                            </label>
                            <label className="astrology-preference"><input type="checkbox" checked={wantsAstrology} onChange={e => setWantsAstrology(e.target.checked)} /><span><strong>Include astrology and lunar features</strong><small>Optional — turn this on whenever you want the cosmic extras.</small></span></label>
                            {wantsAstrology && <>
                            <div className="form-subheading">Your cosmic profile <span className="field-hint">Totally optional — share only what you’re comfortable with.</span></div>
                            <label>Birthday <span className="field-hint">Used to calculate your Sun sign.</span><input type="date" value={birthDate} max={localDateInputValue()} onChange={e => setBirthDate(e.target.value)} /></label>
                            <div className="cycle-settings__number-fields">
                                <label>Birth time <span className="field-hint">If you know it</span><input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} /></label>
                                <label>Birthplace <span className="field-hint">City and country, if known</span><input type="text" maxLength={160} value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="e.g. Nairobi, Kenya" /></label>
                            </div>
                            <div className="cycle-settings__number-fields">
                                <label>Your Moon sign <span className="field-hint">If you already know it</span><select value={moonSign} onChange={e => setMoonSign(e.target.value)}><option value="">I don’t know / skip</option>{SIGNS.map(sign => <option key={sign}>{sign}</option>)}</select></label>
                                <label>Your Rising sign <span className="field-hint">If you already know it</span><select value={risingSign} onChange={e => setRisingSign(e.target.value)}><option value="">I don’t know / skip</option>{SIGNS.map(sign => <option key={sign}>{sign}</option>)}</select></label>
                            </div>
                            </>}
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving your space…' : needsOnboarding ? 'Save my details' : 'Save changes'} <span aria-hidden="true">✧</span></Button>
                            <p className="cycle-settings__privacy">You can leave unknown values blank. We only show a next-period estimate when there’s enough cycle information to calculate one.</p>
                        </form>
                    </section>
                </div>
                <p className="dashboard-disclaimer">Crescent is for personal tracking and self-reflection, not diagnosis or contraception decisions. Cycle estimates can be inaccurate, especially with irregular cycles or hormonal contraception. Moon phases and astrology are included for enjoyment and reflection, not as proven explanations for menstrual changes.</p>
            </main>
            <footer className="dashboard-footer"><span>crescent. · your rhythm, your rules</span><a href="/">Back to the beginning ↑</a></footer>
        </div>
    );
}
