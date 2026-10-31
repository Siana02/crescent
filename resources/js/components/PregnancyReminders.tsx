import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Button from './Button';
import { api, REMINDER_CATEGORIES, type PregnancyReminder } from '../utils/pregnancyApi';

const label = (value: string) => REMINDER_CATEGORIES.find(([k]) => k === value)?.[1] ?? value;
const toLocalInput = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function PregnancyReminders({ onChange }: { onChange?: (reminders: PregnancyReminder[]) => void }) {
    const [items, setItems] = useState<PregnancyReminder[] | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [editing, setEditing] = useState<number | null>(null);
    const [title, setTitle] = useState(''); const [category, setCategory] = useState('appointment');
    const [when, setWhen] = useState(''); const [notes, setNotes] = useState(''); const [share, setShare] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try { const r = await api<{ reminders: PregnancyReminder[] }>('/api/pregnancy/reminders'); setItems(r.reminders); onChange?.(r.reminders); setError(''); }
        catch (e) { setError(e instanceof Error ? e.message : 'Reminders could not load.'); }
    }, [onChange]);
    useEffect(() => { void load(); }, [load]);

    const reset = () => { setEditing(null); setTitle(''); setCategory('appointment'); setWhen(''); setNotes(''); setShare(false); };
    function edit(r: PregnancyReminder) { setEditing(r.id); setTitle(r.title); setCategory(r.category); setWhen(toLocalInput(r.remind_at)); setNotes(r.notes ?? ''); setShare(r.share_with_partner); setNotice(''); }
    async function submit(event: FormEvent) {
        event.preventDefault(); setBusy(true); setError(''); setNotice('');
        try {
            const body = { title: title.trim(), category, remind_at: new Date(when).toISOString(), notes: notes.trim() || null, share_with_partner: share };
            const r = editing ? await api<{ message: string }>('/api/pregnancy/reminders/' + editing, 'PATCH', body) : await api<{ message: string }>('/api/pregnancy/reminders', 'POST', body);
            setNotice(r.message); reset(); await load();
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this reminder.'); } finally { setBusy(false); }
    }
    async function act(fn: () => Promise<{ message: string }>) {
        setError(''); setNotice('');
        try { setNotice((await fn()).message); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'That did not work.'); }
    }
    const now = Date.now();
    const upcoming = (items ?? []).filter(r => !r.completed_at && new Date(r.remind_at).getTime() >= now);
    const past = (items ?? []).filter(r => r.completed_at || new Date(r.remind_at).getTime() < now).reverse();
    const row = (r: PregnancyReminder) => <li key={r.id} className={r.completed_at ? 'is-done' : ''}>
        <div><strong>{r.title}</strong> <em>{label(r.category)}</em>{r.share_with_partner && <span className="pview-tag">Shared</span>}<br /><time dateTime={r.remind_at}>{new Date(r.remind_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>{r.notes && <p>{r.notes}</p>}</div>
        <div className="pview-row-actions">
            <button type="button" onClick={() => act(() => api('/api/pregnancy/reminders/' + r.id, 'PATCH', { completed: !r.completed_at }))}>{r.completed_at ? 'Reopen' : 'Done'}</button>
            <button type="button" onClick={() => edit(r)}>Edit</button>
            <button type="button" onClick={() => { if (window.confirm('Delete this reminder?')) void act(() => api('/api/pregnancy/reminders/' + r.id, 'DELETE')); }}>Delete</button>
        </div></li>;

    return <div className="preminders">
        <form onSubmit={submit} className="pregnancy-reminder-form">
            <h3>{editing ? 'Edit reminder' : 'New reminder or appointment'}</h3>
            <label>What needs remembering?<input required maxLength={140} value={title} onChange={e => setTitle(e.target.value)} /></label>
            <div className="pregnancy-reminder-fields">
                <label>Type<select value={category} onChange={e => setCategory(e.target.value)}>{REMINDER_CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label>When<input required type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></label>
            </div>
            <label>Details (optional)<textarea rows={2} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
            <label className="pregnancy-reminder-share"><input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} /> Share with my connected partner</label>
            {error && <p className="pregnancy-alert" role="alert">{error}</p>}{notice && <p className="pregnancy-notice" role="status">{notice}</p>}
            <div className="pcheck-actions"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add reminder ✿'}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}</div>
        </form>
        {items === null && !error && <p role="status">Loading reminders…</p>}
        {error && items === null && <Button type="button" variant="outline" onClick={() => void load()}>Try again</Button>}
        {items && <><h3>Upcoming</h3>{upcoming.length ? <ul className="pview-list">{upcoming.map(row)}</ul> : <p className="pview-empty">Nothing upcoming yet.</p>}
            <h3>Past &amp; completed</h3>{past.length ? <ul className="pview-list">{past.map(row)}</ul> : <p className="pview-empty">No past reminders.</p>}</>}
        <small className="pregnancy-reminder-disclaimer">In-app reminders only; they are not emergency alerts. Appointment windows in Crescent are general information, not a clinical schedule: follow your clinic’s plan.</small>
    </div>;
}
