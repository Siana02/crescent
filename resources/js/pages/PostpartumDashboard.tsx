import { useState, type FormEvent } from 'react';
import Button from '../components/Button';
import JourneyNavigation from '../components/JourneyNavigation';
import SharedPartnerSpace from '../components/SharedPartnerSpace';
import PregnancyJourneyExtras from '../components/PregnancyJourneyExtras';
import '../styles/pregnancy.css';

type PostpartumLog = { id: number; log_date: string; category: string; notes: string };
type PostpartumData = {
    user: { name: string; email: string };
    profile: { display_name: string | null; active_journey: string; wants_astrology: boolean };
    pregnancy: {
        due_date: string; status: string; gestational_week: number; trimester: number;
        baby_name?: string|null; baby_birth_date?: string|null; baby_birth_time?: string|null; baby_birth_place?: string|null;
        days_until_due: number; today_checkin: { log_date: string; symptoms: string[]; mood: string | null; energy_level: string | null; notes: string | null } | null; postpartum_logs_today: PostpartumLog[];
    } | null;
};
type Props = { data: PostpartumData; onLogout: () => Promise<void>; onRefresh: () => Promise<void> };
const CATEGORIES = [
    { value: 'feeding', label: 'Feeding', icon: '🍼', detail: 'Feeding notes and times' },
    { value: 'sleep', label: 'Sleep', icon: '☁️', detail: 'Rest and sleep patterns' },
    { value: 'diaper', label: 'Diaper', icon: '🌿', detail: 'Nappy or diaper notes' },
    { value: 'parent_wellbeing', label: 'My wellbeing', icon: '🤍', detail: 'How you are recovering and feeling' },
    { value: 'note', label: 'A little memory', icon: '✧', detail: 'Anything you want to remember' },
];
function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function PostpartumDashboard({ data, onLogout, onRefresh }: Props) {
    const [category, setCategory] = useState('parent_wellbeing');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [inviteType, setInviteType] = useState<'observer' | 'co_tracker'>('observer');
    const [inviteCode, setInviteCode] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [babyFormOpen, setBabyFormOpen] = useState(false);
    const [babyName, setBabyName] = useState(data.pregnancy?.baby_name ?? '');
    const [babyBirthDate, setBabyBirthDate] = useState(data.pregnancy?.baby_birth_date ?? '');
    const [babyBirthTime, setBabyBirthTime] = useState(data.pregnancy?.baby_birth_time ?? '');
    const [babyBirthPlace, setBabyBirthPlace] = useState(data.pregnancy?.baby_birth_place ?? '');
    const [savingBaby, setSavingBaby] = useState(false);
    const firstName = data.profile.display_name?.trim() || data.user.name.split(' ')[0] || 'there';
    const logs = data.pregnancy?.postpartum_logs_today ?? [];

    async function saveLog(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError(''); setNotice('');
        if (!notes.trim()) { setError('Add a short note before saving this little moment.'); return; }
        setIsSaving(true);
        try {
            const response = await fetch('/api/pregnancy/postpartum-checkins', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ category, notes: notes.trim() }),
            });
            const result = await response.json() as { message?: string; errors?: Record<string, string[]> };
            if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0]?.[0] : result.message || 'Your note could not be saved.');
            setNotes(''); setNotice(result.message || 'Your note is saved.');
            await onRefresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Your note could not be saved.');
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

    async function saveBabyDetails(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError(''); setNotice(''); setSavingBaby(true);
        try {
            const response = await fetch('/api/pregnancy/baby-details', {
                method: 'PATCH', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ baby_name: babyName.trim() || null, baby_birth_date: babyBirthDate, baby_birth_time: babyBirthTime || null, baby_birth_place: babyBirthPlace.trim() || null }),
            });
            const result = await response.json() as { message?: string; errors?: Record<string, string[]> };
            if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0]?.[0] : result.message || 'Could not update your baby’s details.');
            setNotice(result.message || 'Your baby’s keepsake details are updated.');
            setBabyFormOpen(false); await onRefresh();
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not update your baby’s details.'); }
        finally { setSavingBaby(false); }
    }

    async function returnToCycle() {
        if (!window.confirm('Return to cycle tracking now? Your pregnancy and postpartum notes will remain saved, and Crescent will not estimate a new cycle until you add new period information.')) return;
        setError(''); setIsReturning(true);
        try {
            const response = await fetch('/api/pregnancy/return-to-cycle', {
                method: 'POST', credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
            });
            const result = await response.json() as { message?: string };
            if (!response.ok) throw new Error(result.message || 'We could not change your journey just yet.');
            window.location.assign('/dashboard');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not change your journey just yet.');
            setIsReturning(false);
        }
    }

    return <div className="pregnancy-shell postpartum-shell">
        <header className="pregnancy-header">
            <a className="pregnancy-brand" href="/" aria-label="Crescent home"><span>☾</span> crescent<span>.</span></a>
            <div className="pregnancy-header__actions"><span>A softer space for {firstName}</span><Button variant="outline" onClick={onLogout}>Sign out</Button></div>
        </header>
        <JourneyNavigation active="dashboard" journey="postpartum" />
        <main className="pregnancy-main">
            <section className="pregnancy-hero postpartum-hero">
                <div className="pregnancy-hero__sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>☾</span><span>❀</span></div>
                <p className="pregnancy-eyebrow">YOUR NEXT CHAPTER · POSTPARTUM & NEWBORN JOURNAL</p>
                <h1>Hello, {firstName}<em>A new little universe.</em></h1>
                <p className="pregnancy-hero__copy">The pregnancy chapter stays in your history. This space is for the days after birth: your recovery, your baby’s little rhythms, and the moments you want to remember.</p>
                <div className="pregnancy-hero__chips"><span>Pregnancy history preserved</span><span>Private by default</span></div>
            </section>

            <section className="postpartum-welcome">
                {data.pregnancy && <div className="postpartum-baby-keepsake"><span aria-hidden="true">✿</span><div><p className="pregnancy-eyebrow">YOUR BABY’S FIRST SKY</p><h2>{data.pregnancy.baby_name?.trim() ? data.pregnancy.baby_name + '’s little universe' : 'A little keepsake for your newborn'}</h2>{data.pregnancy.baby_birth_date ? <p>Born {new Intl.DateTimeFormat(undefined,{dateStyle:'long'}).format(new Date(data.pregnancy.baby_birth_date+'T12:00:00'))}{data.pregnancy.baby_birth_place ? ' · '+data.pregnancy.baby_birth_place : ''}</p> : <p>Add your baby’s birth details to create their keepsake.</p>}<a href="/astrology?subject=baby">Visit baby’s Cosmic Atelier ↗</a><button type="button" className="pregnancy-floral-button" onClick={() => setBabyFormOpen(open => !open)}>{babyFormOpen ? 'Close birth details' : 'Update birth details'}</button></div>
                    {babyFormOpen && <form className="pregnancy-birth-form" onSubmit={saveBabyDetails}>
                        <label>Baby’s name (optional)<input value={babyName} maxLength={80} onChange={event => setBabyName(event.target.value)} /></label>
                        <div className="pregnancy-birth-fields"><label>Birth date *<input type="date" required max={new Date().toISOString().slice(0,10)} value={babyBirthDate} onChange={event => setBabyBirthDate(event.target.value)} /></label><label>Birth time (if known)<input type="time" value={babyBirthTime} onChange={event => setBabyBirthTime(event.target.value)} /></label></div>
                        <label>Birthplace (optional)<input value={babyBirthPlace} maxLength={180} onChange={event => setBabyBirthPlace(event.target.value)} placeholder="Town, city or hospital" /></label>
                        {error && <p className="pregnancy-alert" role="alert">{error}</p>}
                        <Button type="submit" disabled={savingBaby}>{savingBaby ? 'Saving…' : 'Save birth details ✿'}</Button>
                    </form>}
                </div>}
                <div className="postpartum-welcome__icon" aria-hidden="true">🌷</div>
                <div><p className="pregnancy-eyebrow">A GENTLE REMINDER</p><h2>You do not have to track everything.</h2><p>Use these notes only when they help. Crescent will not automatically return you to period or fertility predictions; you can choose what comes next when you feel ready.</p></div>
            </section>

            <section className="pregnancy-checkin-section">
                <div className="pregnancy-section-heading"><p className="pregnancy-eyebrow">A LITTLE LOGBOOK</p><h2>What would you like to remember?</h2><p>Choose a page for this note, then write as much or as little as you like.</p></div>
                <form className="postpartum-log-form" onSubmit={saveLog}>
                    <div className="postpartum-category-grid">{CATEGORIES.map(item => <button type="button" key={item.value} aria-pressed={category === item.value} className={category === item.value ? 'postpartum-category is-selected' : 'postpartum-category'} onClick={() => setCategory(item.value)}><span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.detail}</small></button>)}</div>
                    <label className="pregnancy-notes">Your note <small>Optional details · keep it simple</small><textarea rows={4} maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="A feed, a nap, a nappy change, a feeling, a tiny first…" /></label>
                    {error && <p className="pregnancy-alert" role="alert">{error}</p>}{notice && <p className="pregnancy-notice" role="status">{notice}</p>}
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving your little note…' : 'Save to my logbook ✧'}</Button>
                </form>
            </section>

            <section className="postpartum-today">
                <p className="pregnancy-eyebrow">TODAY’S LITTLE TRAIL</p><h2>Things you’ve tucked away</h2>
                {logs.length ? <div className="postpartum-log-list">{logs.map(log => <article key={log.id}><span>{CATEGORIES.find(item => item.value === log.category)?.icon ?? '✧'}</span><div><strong>{CATEGORIES.find(item => item.value === log.category)?.label ?? 'Note'}</strong><small>{log.notes}</small></div></article>)}</div> : <p className="postpartum-empty">Nothing logged today — and that is completely okay. This space will be here when you need it.</p>}
            </section>

            <PregnancyJourneyExtras week={data.pregnancy?.gestational_week ?? 1} trimester={data.pregnancy?.trimester ?? 1} postpartum baby={data.pregnancy ? {name:data.pregnancy.baby_name,birth_date:data.pregnancy.baby_birth_date,birth_time:data.pregnancy.baby_birth_time,birth_place:data.pregnancy.baby_birth_place} : null} />
            <SharedPartnerSpace />
            <section className="pregnancy-companion">
                <div><p className="pregnancy-eyebrow">YOUR PEOPLE, YOUR CHOICE</p><h2>Invite someone into this chapter</h2><p>You can invite a partner or companion whenever you are ready. Connecting never switches sharing on automatically.</p></div>
                <form onSubmit={createInvite}><label>Choose a companion role<select value={inviteType} onChange={event => setInviteType(event.target.value as 'observer' | 'co_tracker')}><option value="observer">Partner or observer</option><option value="co_tracker">Co-tracking companion</option></select></label><Button type="submit" disabled={isInviting}>{isInviting ? 'Creating code…' : 'Create a Cosmic Sync Code ✧'}</Button></form>
                {inviteCode && <div className="pregnancy-invite-code"><small>Your invitation code</small><strong>{inviteCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copy code</button><span>Expires in seven days. Your details stay private until you choose to share.</span></div>}
            </section>

            <section className="pregnancy-transition postpartum-return">
                <div><p className="pregnancy-eyebrow">WHEN YOU FEEL READY</p><h2>Return to cycle tracking on your terms</h2><p>There is no automatic switch back after birth. When you feel ready, you can return to cycle tracking; your pregnancy and postpartum notes stay saved, and we won’t assume your old cycle length still applies.</p></div>
                <Button type="button" variant="outline" disabled={isReturning} onClick={returnToCycle}>{isReturning ? 'Preparing your cycle space…' : 'I’m ready to return to cycle tracking'}</Button>
            </section>
            <p className="pregnancy-medical-note">Crescent is a personal journal, not medical care. For concerns about your recovery or your baby’s health, contact your healthcare professional or local emergency service.</p>
        </main>
        <footer className="pregnancy-footer"><span>crescent. · your rhythm, your rules</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Help &amp; support</a><a href="/">Back to the beginning ↑</a></footer>
    </div>;
}
