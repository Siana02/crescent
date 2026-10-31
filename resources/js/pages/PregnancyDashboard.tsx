import { useEffect, useState, type FormEvent } from 'react';
import SiteCredit from '../components/SiteCredit';
import Button from '../components/Button';
import JourneyNavigation from '../components/JourneyNavigation';
import PregnancyCalendar from '../components/PregnancyCalendar';
import PregnancyCheckinForm from '../components/PregnancyCheckinForm';
import PregnancyTrends from '../components/PregnancyTrends';
import PregnancyReminders from '../components/PregnancyReminders';
import { contentFor, URGENT_SYMPTOM_GUIDANCE } from '../content/pregnancyContent';
import { todayIn, prettyDate as prettyYmd } from '../utils/pregnancyDates';
import type { PregnancyCheckin as ApiCheckin, PregnancyReminder } from '../utils/pregnancyApi';
import SharedPartnerSpace from '../components/SharedPartnerSpace';
import PregnancyJourneyExtras from '../components/PregnancyJourneyExtras';
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
    baby_name?: string | null;
    baby_birth_date?: string | null;
    baby_birth_time?: string | null;
    baby_birth_place?: string | null;
    gestational_week: number;
    gestational_day_in_week: number;
    gestational_days: number;
    trimester: number;
    days_until_due: number;
    today_checkin: PregnancyCheckin | null;
};
type PregnancyDashboardData = {
    user: { name: string; email: string };
    profile: { display_name: string | null; active_journey: string; wants_astrology: boolean; timezone?: string };
    pregnancy: PregnancySummary | null;
};
type Props = {
    data: PregnancyDashboardData;
    onLogout: () => Promise<void>;
    onRefresh: () => Promise<void>;
};

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
const WEEKLY_SIZE: Record<number, { size: string; icon: string }> = {
    4: { size: 'poppy seed', icon: '🌱' }, 5: { size: 'sesame seed', icon: '🌱' },
    6: { size: 'lentil', icon: '🫘' }, 7: { size: 'grape', icon: '🍇' },
    8: { size: 'raspberry', icon: '🍓' }, 9: { size: 'cherry', icon: '🍒' },
    10: { size: 'strawberry', icon: '🍓' }, 11: { size: 'fig', icon: '🫒' },
    12: { size: 'plum', icon: '🟣' }, 13: { size: 'peach', icon: '🍑' },
    14: { size: 'lemon', icon: '🍋' }, 15: { size: 'apple', icon: '🍎' },
    16: { size: 'avocado', icon: '🥑' }, 17: { size: 'pear', icon: '🍐' },
    18: { size: 'bell pepper', icon: '🫑' }, 19: { size: 'mango', icon: '🥭' },
    20: { size: 'banana', icon: '🍌' }, 21: { size: 'carrot', icon: '🥕' },
    22: { size: 'papaya', icon: '🥭' }, 23: { size: 'grapefruit', icon: '🍊' },
    24: { size: 'ear of corn', icon: '🌽' }, 25: { size: 'cauliflower', icon: '🥦' },
    26: { size: 'lettuce', icon: '🥬' }, 27: { size: 'cauliflower', icon: '🥦' },
    28: { size: 'eggplant', icon: '🍆' }, 29: { size: 'butternut squash', icon: '🎃' },
    30: { size: 'cabbage', icon: '🥬' }, 31: { size: 'coconut', icon: '🥥' },
    32: { size: 'squash', icon: '🎃' }, 33: { size: 'pineapple', icon: '🍍' },
    34: { size: 'cantaloupe', icon: '🍈' }, 35: { size: 'honeydew melon', icon: '🍈' },
    36: { size: 'romaine lettuce', icon: '🥬' }, 37: { size: 'Swiss chard', icon: '🥬' },
    38: { size: 'leek', icon: '🥬' }, 39: { size: 'mini watermelon', icon: '🍉' },
    40: { size: 'pumpkin', icon: '🎃' },
};
function sizeComparison(week: number): { size: string; icon: string } | null {
    return WEEKLY_SIZE[week] ?? null;
}

function ContentCard({ entry, label }: { entry: { heading: string; body: string; source: { name: string; url: string }; lastReviewed: string }; label: string }) {
    return <article className="pview-card"><small>{label.toUpperCase()}</small><h3>{entry.heading}</h3><p>{entry.body}</p><small>Source: <a href={entry.source.url} target="_blank" rel="noreferrer">{entry.source.name}</a> · reviewed {entry.lastReviewed}</small></article>;
}

const VIEWS = [
    ['home', 'Home'], ['calendar', 'Pregnancy calendar'], ['symptoms', 'Symptoms & wellbeing'], ['baby', 'Baby development'],
    ['appointments', 'Appointments & reminders'], ['shared', 'Shared space'],
] as const;
type View = typeof VIEWS[number][0];
function viewFromHash(): View {
    const hash = window.location.hash.replace('#', '');
    return (VIEWS.find(([key]) => key === hash)?.[0]) ?? 'home';
}

export default function PregnancyDashboard({ data, onLogout, onRefresh }: Props) {
    const pregnancy = data.pregnancy;
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [inviteType, setInviteType] = useState<'observer' | 'co_tracker'>('observer');
    const [inviteSharing, setInviteSharing] = useState({ pregnancy_details: true, wellbeing_updates: true, astrology: false });
    const [inviteCode, setInviteCode] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showBirthForm, setShowBirthForm] = useState(false);
    const [babyName, setBabyName] = useState('');
    const [babyBirthDate, setBabyBirthDate] = useState('');
    const [babyBirthTime, setBabyBirthTime] = useState('');
    const [babyBirthPlace, setBabyBirthPlace] = useState('');
    const [view, setView] = useState<View>(viewFromHash);
    const [refreshKey, setRefreshKey] = useState(0);
    const [reminders, setReminders] = useState<PregnancyReminder[]>([]);
    const [babyWeek, setBabyWeek] = useState<number | null>(null);
    const timezone = data.profile.timezone;
    const today = todayIn(timezone);
    useEffect(() => {
        const onHash = () => setView(viewFromHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    useEffect(() => {
        let live = true;
        fetch('/api/pregnancy/reminders', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then(r => r.ok ? r.json() : { reminders: [] }).then(d => { if (live) setReminders(d.reminders ?? []); }).catch(() => undefined);
        return () => { live = false; };
    }, []);
    const goTo = (next: View) => { setView(next); window.history.replaceState(null, '', '#' + next); window.scrollTo({ top: 0 }); };
    const firstName = data.profile.display_name?.trim() || data.user.name.split(' ')[0] || 'there';

    async function createInvite(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError(''); setInviteCode(''); setIsInviting(true);
        try {
            const response = await fetch('/api/relationships/invite', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ relationship_type: inviteType, sharing_preferences: { cycle_details: false, pregnancy_details: inviteSharing.pregnancy_details, wellbeing_updates: inviteSharing.wellbeing_updates, astrology: inviteSharing.astrology } }),
            });
            const result = await response.json() as { invite_code?: string; message?: string; errors?: Record<string, string[]> };
            if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0]?.[0] : result.message || 'We could not create an invitation.');
            setInviteCode(result.invite_code ?? '');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not create an invitation.');
        } finally { setIsInviting(false); }
    }

    async function transitionToPostpartum(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(''); setIsTransitioning(true);
        try {
            const response = await fetch('/api/pregnancy/postpartum', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ baby_name: babyName.trim() || null, baby_birth_date: babyBirthDate, baby_birth_time: babyBirthTime || null, baby_birth_place: babyBirthPlace.trim() || null }),
            });
            const result = await response.json() as { message?: string; errors?: Record<string, string[]> };
            if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0]?.[0] : result.message || 'We could not open your postpartum space.');
            window.location.assign('/dashboard');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not open your postpartum space.');
            setIsTransitioning(false);
        }
    }

    if (!pregnancy) return <main className="pregnancy-empty"><div className="pregnancy-empty__moon">☾</div><p className="pregnancy-eyebrow">YOUR PREGNANCY JOURNEY</p><h1>Your space is almost ready</h1><p>We couldn’t find a saved pregnancy date. Return to onboarding to finish setting up your pregnancy journey.</p><Button onClick={() => window.location.assign('/onboarding')}>Finish my setup ✧</Button></main>;

    const week = pregnancy.gestational_week;
    const dailyContent = contentFor(week, pregnancy.gestational_days);
    const shownWeek = babyWeek ?? week;
    const shownContent = contentFor(shownWeek, shownWeek * 7);
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
        <JourneyNavigation active="dashboard" journey="pregnancy" />
        <nav className="pview-nav" aria-label="Pregnancy portal">
            <ul>{VIEWS.map(([key, label]) => <li key={key}><button type="button" aria-current={view === key ? 'page' : undefined} className={view === key ? 'is-active' : ''} onClick={() => goTo(key)}>{label}</button></li>)}
                {pregnancy.wants_baby_astrology && data.profile.wants_astrology && <li><a href="/astrology?subject=baby">The Cosmic Atelier</a></li>}
                <li><a href="/profile">Profile &amp; settings</a></li></ul>
        </nav>
        <main className="pregnancy-main" id="main">
            {view === 'home' && <>
            <section className="pregnancy-hero">
                <div className="pregnancy-hero__sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>☾</span><span>❀</span></div>
                <p className="pregnancy-eyebrow">YOUR PREGNANCY UNIVERSE · A JOURNEY OF ITS OWN</p>
                <p className="pregnancy-hero__date">{prettyYmd(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <h1>Hello, {firstName}<em>Growing under the stars.</em></h1>
                <p className="pregnancy-hero__copy">This space follows your pregnancy journey — not a period countdown. Your dates, body and story deserve their own chapter.</p>
                <div className="pregnancy-hero__chips"><span>Trimester {pregnancy.trimester}</span><span>{daysCopy}</span></div>
            </section>
            <section id="pregnancy-overview" className="pregnancy-overview">
                <article className="pregnancy-week-card">
                    <div className="pregnancy-week-ring" style={{ background: 'conic-gradient(#a78bb4 ' + progress + '%, #eee4f0 0)' }}><div><strong>{week}</strong><span>WEEK</span></div></div>
                    <div className="pregnancy-week-card__copy"><p className="pregnancy-eyebrow">YOUR PREGNANCY, RIGHT NOW</p><h2>Week {week} + {pregnancy.gestational_day_in_week} day{pregnancy.gestational_day_in_week === 1 ? '' : 's'}</h2><p>{pregnancy.gestational_days} days into your pregnancy · trimester {pregnancy.trimester}</p><small>{pregnancy.gestational_days >= 0 ? 'Gestational age is an estimate from your saved dating. Your clinician may revise your estimated due date after a scan.' : ''}</small>{sizeComparison(week) && <div className="pregnancy-size-comparison"><span aria-hidden="true">{sizeComparison(week)?.icon}</span><div><small>JUST-FOR-FUN SIZE COMPARISON</small><strong>About the size of a {sizeComparison(week)?.size}</strong><small className="pregnancy-size-note">A playful comparison only — growth varies and this is not a growth assessment.</small></div></div>}</div>
                </article>
                <article className="pregnancy-due-card"><span aria-hidden="true">🌷</span><p className="pregnancy-eyebrow">YOUR ESTIMATED DUE DATE</p><strong>{prettyDate(pregnancy.due_date)}</strong><p>{daysCopy}</p><small>Dates are estimates, not promises. Your maternity care team may revise your due date.</small><a className="pregnancy-edit-link" href="/onboarding?journey=pregnancy">Update dates or cosmic preferences ↗</a></article>
            </section>
            <section className="pview-today" aria-labelledby="ptoday-title">
                <p className="pregnancy-eyebrow">TODAY · WEEK {week} + {pregnancy.gestational_day_in_week}</p>
                <h2 id="ptoday-title">{dailyContent.exactDay?.heading ?? dailyContent.weekly.heading}</h2>
                {!dailyContent.isExactWeek && <p className="pview-note">There is no new milestone for this week. This is ongoing development carried forward from week {Array.isArray(dailyContent.weekly.week) ? dailyContent.weekly.week[0] : dailyContent.weekly.week}.</p>}
                <p>{dailyContent.exactDay?.body ?? dailyContent.weekly.body}</p>
                <div className="pview-cards">
                    {dailyContent.body && <ContentCard entry={dailyContent.body} label="Your body" />}
                    {dailyContent.wellbeing && <ContentCard entry={dailyContent.wellbeing} label="Today’s wellbeing idea" />}
                    {dailyContent.prenatalCare && <ContentCard entry={dailyContent.prenatalCare} label="Prenatal care" />}
                    {dailyContent.partner && <ContentCard entry={dailyContent.partner} label="For your support person" />}
                </div>
                <div className="pview-actions"><Button type="button" onClick={() => goTo('symptoms')}>Log today’s check-in ✧</Button><Button type="button" variant="outline" onClick={() => goTo('calendar')}>Open my calendar</Button></div>
                <p className="pview-note">{dailyContent.weekly.disclaimer}</p>
            </section>

            <section id="pregnancy-transition" className="pregnancy-transition">
                <div><p className="pregnancy-eyebrow">WHEN YOUR CHAPTER CHANGES</p><h2>Make room for the next little universe</h2><p>When your baby has arrived, enter their birth details to create a little keepsake and move into your postpartum and newborn journal. Your pregnancy history stays saved.</p></div>
                {!showBirthForm && <Button type="button" variant="outline" onClick={() => setShowBirthForm(true)}>My baby has arrived · begin postpartum</Button>}
                {showBirthForm && <form className="pregnancy-birth-form" onSubmit={transitionToPostpartum}>
                    <label>Baby’s name (optional)<input value={babyName} maxLength={80} onChange={event => setBabyName(event.target.value)} placeholder="A name or little nickname" /></label>
                    <div className="pregnancy-birth-fields"><label>Baby’s birth date *<input type="date" required max={new Date().toISOString().slice(0,10)} value={babyBirthDate} onChange={event => setBabyBirthDate(event.target.value)} /></label><label>Birth time (if known)<input type="time" value={babyBirthTime} onChange={event => setBabyBirthTime(event.target.value)} /></label></div>
                    <label>Birthplace (optional)<input value={babyBirthPlace} maxLength={180} onChange={event => setBabyBirthPlace(event.target.value)} placeholder="Town, city or hospital" /></label>
                    <p className="pregnancy-gentle-note">Birth time and place help refine a natal chart. Add only what you know; you can keep these details private.</p>
                    {error && <p className="pregnancy-alert" role="alert">{error}</p>}
                    <div className="pregnancy-birth-actions"><Button type="submit" disabled={isTransitioning}>{isTransitioning ? 'Preparing your next chapter…' : 'Save birth details & open postpartum ✿'}</Button><Button type="button" variant="outline" onClick={() => setShowBirthForm(false)} disabled={isTransitioning}>Not yet</Button></div>
                </form>}
            </section>
</>}
            {view === 'calendar' && <PregnancyCalendar dueDate={pregnancy.due_date} today={today} timezone={timezone} reminders={reminders} refreshKey={refreshKey} onChanged={() => { setRefreshKey(k => k + 1); void onRefresh(); }} />}
            {view === 'symptoms' && <>
            <section id="pregnancy-checkin" className="pregnancy-checkin-section">
                <div className="pregnancy-section-heading"><p className="pregnancy-eyebrow">YOUR DAILY CHECK-IN</p><h2>How are you feeling today?</h2><p>Log only what feels useful. You can also edit past days from the calendar.</p></div>
                {notice && <p className="pregnancy-notice" role="status">{notice}</p>}
                <PregnancyCheckinForm date={today} existing={pregnancy.today_checkin as ApiCheckin | null} showMovement={week >= 16} onSaved={(_, message) => { setNotice(message); setRefreshKey(k => k + 1); void onRefresh(); }} />
            </section>
            <section className="pview-section" aria-labelledby="ptrend-title"><p className="pregnancy-eyebrow">LAST 28 DAYS</p><h2 id="ptrend-title">Your symptom and wellbeing trends</h2><PregnancyTrends today={today} refreshKey={refreshKey} /></section>
            <section className="pview-section pview-urgent" aria-labelledby="purgent-title"><h2 id="purgent-title">{URGENT_SYMPTOM_GUIDANCE.heading}</h2><p>{URGENT_SYMPTOM_GUIDANCE.body}</p><small>Source: <a href={URGENT_SYMPTOM_GUIDANCE.source.url} target="_blank" rel="noreferrer">{URGENT_SYMPTOM_GUIDANCE.source.name}</a></small></section>
</>}
            {view === 'baby' && <>
            <section id="pregnancy-baby" className="pview-section" aria-labelledby="pbaby-title">
                <p className="pregnancy-eyebrow">BABY DEVELOPMENT · EDUCATIONAL</p>
                <div className="pview-weeknav"><button type="button" disabled={shownWeek <= 0} onClick={() => setBabyWeek(shownWeek - 1)}>‹ Week {shownWeek - 1}</button><h2 id="pbaby-title">Week {shownWeek}{shownWeek === week ? ' · this week' : shownWeek < week ? ' · past' : ' · coming up'}</h2><button type="button" disabled={shownWeek >= 42} onClick={() => setBabyWeek(shownWeek + 1)}>Week {shownWeek + 1} ›</button></div>
                {shownWeek !== week && <button type="button" className="pview-link" onClick={() => setBabyWeek(null)}>Back to this week</button>}
                <h3>{shownContent.weekly.heading}</h3>
                {!shownContent.isExactWeek && <p className="pview-note">Ongoing development carried forward from an earlier week; nothing new is claimed for this week.</p>}
                <p>{shownContent.weekly.body}</p>
                {sizeComparison(shownWeek) && <p className="pview-size"><span aria-hidden="true">{sizeComparison(shownWeek)?.icon}</span> Illustrative size comparison: about a {sizeComparison(shownWeek)?.size}. Babies vary and this is not a measurement of your baby.</p>}
                {shownContent.milestones.map(m => <ContentCard key={m.id} entry={m} label="Common milestone window" />)}
                {shownContent.body && <ContentCard entry={shownContent.body} label="Body changes" />}
                <p className="pview-note">Reaching or missing a milestone does not tell you whether your baby is developing normally. Only your care team can assess that.</p>
                <small>Source: <a href={shownContent.weekly.source.url} target="_blank" rel="noreferrer">{shownContent.weekly.source.name}</a> · last reviewed {shownContent.weekly.lastReviewed}</small>
            </section>
            <PregnancyJourneyExtras week={week} trimester={pregnancy.trimester} showPlanner={false} />
            {pregnancy.wants_baby_astrology && <section id="pregnancy-cosmos" className="pregnancy-cosmos">
                <div className="pregnancy-cosmos__intro"><p className="pregnancy-eyebrow">THE STAR CHILD KEEPSAKE</p><h2>A sky snapshot for the date you’re dreaming of</h2><p>A playful look at the sky around your estimated due date — not a prediction of the actual birth chart.</p></div>
                <div className="pregnancy-cosmos__cards">
                    <article><span className="pregnancy-cosmos__icon">{sunSignForDate(pregnancy.due_date)}</span><small>Possible Sun sign if born on the due date</small><strong>{sunSignForDate(pregnancy.due_date)}</strong></article>
                    <article><span className="pregnancy-cosmos__icon">{moonOnDueDate.symbol}</span><small>Approximate moon phase on the due date</small><strong>{moonOnDueDate.name}</strong></article>
                </div>
                <p className="pregnancy-cosmos__disclaimer">The actual birth date, time and place affect a birth chart. Due dates can change, and astrology is for enjoyment rather than medical or developmental guidance.</p>
            </section>}
</>}
            {view === 'appointments' && <section className="pview-section"><p className="pregnancy-eyebrow">APPOINTMENTS &amp; REMINDERS</p><h2>Your care planner</h2><PregnancyReminders onChange={items => { setReminders(items); setRefreshKey(k => k + 1); }} /></section>}
            {view === 'shared' && <>
            <section id="pregnancy-companion" className="pregnancy-companion">
                <div><p className="pregnancy-eyebrow">YOUR PEOPLE, YOUR CHOICE</p><h2>Invite someone into this chapter</h2><p>You can begin solo and invite a partner or companion whenever you’re ready. Connecting never switches sharing on automatically.</p></div>
                <form className="pregnancy-invite-form" onSubmit={createInvite}><label>Choose a companion role<select value={inviteType} onChange={event => setInviteType(event.target.value as 'observer' | 'co_tracker')}><option value="observer">Partner or observer</option><option value="co_tracker">Co-cycling companion</option></select></label>
                    <fieldset className="pregnancy-invite-sharing"><legend>Choose what to share from the start</legend>
                        <label><input type="checkbox" checked={inviteSharing.pregnancy_details} onChange={event => setInviteSharing(value => ({...value,pregnancy_details:event.target.checked}))}/> Pregnancy stage and due-date details</label>
                        <label><input type="checkbox" checked={inviteSharing.wellbeing_updates} onChange={event => setInviteSharing(value => ({...value,wellbeing_updates:event.target.checked}))}/> Symptoms and wellbeing updates</label>
                        <label><input type="checkbox" checked={inviteSharing.astrology} onChange={event => setInviteSharing(value => ({...value,astrology:event.target.checked}))}/> Astrology reflections (both people must opt in)</label>
                    </fieldset>
                    <small>You can adjust these permissions later in Connections. Private notes stay private unless you choose to share them.</small>
                    <Button type="submit" disabled={isInviting}>{isInviting ? 'Creating code…' : 'Create a Cosmic Sync Code ✧'}</Button></form>
                {error && view === 'shared' && <p className="pregnancy-alert" role="alert">{error}</p>}
                {inviteCode && <div className="pregnancy-invite-code"><small>Your invitation code</small><strong>{inviteCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copy code</button><span>Expires in seven days. Your details stay private until you choose to share.</span></div>}
            </section>
            <SharedPartnerSpace />
</>}
            <p className="pregnancy-medical-note">Crescent is a personal journal, not a medical device or a substitute for prenatal care. Symptom logs do not assess risk or diagnose conditions. If a symptom worries you or feels urgent, contact your maternity care team or local emergency service.</p>
        </main>
        <footer className="pregnancy-footer"><span>crescent. · one week, one moment, one breath at a time</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Help &amp; support</a><a href="/">Back to the beginning ↑</a><SiteCredit /></footer>
    </div>;
}
