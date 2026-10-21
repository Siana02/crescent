import { useState, type FormEvent } from 'react';
import Button from '../components/Button';
import '../styles/pregnancy.css';

type PostpartumLog = { id: number; log_date: string; category: string; notes: string };
type PostpartumData = {
    user: { name: string; email: string };
    profile: { display_name: string | null; active_journey: string; wants_astrology: boolean };
    pregnancy: {
        due_date: string; status: string; gestational_week: number; trimester: number;
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
function prettyDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
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
        <main className="pregnancy-main">
            <section className="pregnancy-hero postpartum-hero">
                <div className="pregnancy-hero__sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>☾</span><span>❀</span></div>
                <p className="pregnancy-eyebrow">YOUR NEXT CHAPTER · POSTPARTUM & NEWBORN JOURNAL</p>
                <h1>Hello, {firstName}<em>A new little universe.</em></h1>
                <p className="pregnancy-hero__copy">The pregnancy chapter stays in your history. This space is for the days after birth: your recovery, your baby’s little rhythms, and the moments you want to remember.</p>
                <div className="pregnancy-hero__chips"><span>Pregnancy history preserved</span><span>Private by default</span></div>
            </section>

            <section className="postpartum-welcome">
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
        <footer className="pregnancy-footer"><span>crescent. · your rhythm, your rules</span><a href="/">Back to the beginning ↑</a></footer>
    </div>;
}
