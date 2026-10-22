import { useEffect, useState, type FormEvent } from 'react';
import Button from '../components/Button';
import '../styles/cosmic-dashboard.css';

type RelationshipType = 'observer' | 'co_tracker';
type SharingKey = 'cycle_details' | 'pregnancy_details' | 'wellbeing_updates' | 'astrology';
type SharingPreferences = Record<SharingKey, boolean>;
type Relationship = {
    id: number;
    relationship_type: RelationshipType;
    status: 'pending' | 'accepted' | 'revoked';
    invite_code: string | null;
    companion_name: string | null;
    companion_journey: 'cycle' | 'fertility' | 'pregnancy' | 'postpartum' | null;
    companion_goal?: string | null;
    companion_sun_sign?: string | null;
    companion_moon_sign?: string | null;
    companion_rising_sign?: string | null;
    sharing_enabled: boolean;
    sharing_preferences: SharingPreferences;
    companion_sharing_preferences: SharingPreferences;
};
type Note = { id: number; author_id: number; author_name: string; note_date: string; body: string; is_mine: boolean; read_at: string | null; created_at: string | null };
type NotesPayload = { notes: Note[]; can_write: boolean; today_note: { id: number; body: string; read_at: string | null } | null };
type InsightPayload = {
    compatibility: { available: boolean; summary: string; themes: { label: string; left: string; right: string; tone: string; text: string }[]; aspects?: { left: string; right: string; aspect: string; orb: number; tone: string; text: string }[] };
    daily: { date: string; title: string; tip: string; transit_note: string; transits: { name: string; sign?: string | null; degree?: number | null }[]; personal_transits?: { left: string; right: string; aspect: string; orb: number; tone: string; text: string }[]; source: string };
};
const emptySharing: SharingPreferences = { cycle_details: false, pregnancy_details: false, wellbeing_updates: false, astrology: false };
const sharingOptions: { key: SharingKey; title: string; detail: string; icon: string }[] = [
    { key: 'cycle_details', title: 'Cycle updates', detail: 'Cycle journey and cycle-related updates', icon: 'water_drop' },
    { key: 'pregnancy_details', title: 'Pregnancy updates', detail: 'Pregnancy or postpartum journey', icon: 'child_care' },
    { key: 'wellbeing_updates', title: 'Wellbeing check-ins', detail: 'Mood and wellbeing updates chosen to share', icon: 'favorite' },
    { key: 'astrology', title: 'Astrology', detail: 'Natal signs for compatibility reflections', icon: 'auto_awesome' },
];
function csrf() { return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''; }
async function readJson(response: Response) { return response.json().catch(() => ({})) as Promise<Record<string, any>>; }
function journeyLabel(journey: Relationship['companion_journey']) {
    return journey === 'pregnancy' ? 'Pregnancy journey' : journey === 'postpartum' ? 'Postpartum journey' : journey === 'fertility' ? 'Trying to conceive' : journey === 'cycle' ? 'Cycle tracking' : 'Journey not shared yet';
}
function dateLabel(value: string) { return new Date(value + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }

export default function ConnectionsPage() {
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [profileRole, setProfileRole] = useState<'tracker' | 'support'>('tracker');
    const [ownJourney, setOwnJourney] = useState<Relationship['companion_journey']>('cycle');
    const [kind, setKind] = useState<RelationshipType>('observer');
    const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('code')?.trim().toUpperCase().slice(0, 8) ?? '');
    const [newCode, setNewCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [notes, setNotes] = useState<Record<number, NotesPayload>>({});
    const [drafts, setDrafts] = useState<Record<number, string>>({});
    const [insights, setInsights] = useState<Record<number, InsightPayload>>({});
    const [savingNote, setSavingNote] = useState<number | null>(null);
    const [savingSharing, setSavingSharing] = useState<number | null>(null);

    async function load() {
        const response = await fetch('/api/dashboard', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
        if (response.status === 401) { window.location.assign('/login'); return; }
        const data = await readJson(response);
        if (!response.ok) throw new Error(data.message ?? 'Could not load your connections.');
        setProfileRole(data.profile?.relationship_role === 'support' ? 'support' : 'tracker');
        setOwnJourney(data.profile?.active_journey ?? 'cycle');
        setRelationships((data.relationships ?? []).map((relationship: Partial<Relationship>) => ({
            ...relationship,
            sharing_preferences: { ...emptySharing, ...(relationship.sharing_preferences ?? {}) },
            companion_sharing_preferences: { ...emptySharing, ...(relationship.companion_sharing_preferences ?? {}) },
        })) as Relationship[]);
    }

    useEffect(() => { void load().catch(() => setError('Could not load your connections. Please refresh.')); }, []);
    useEffect(() => {
        const accepted = relationships.filter(relationship => relationship.status === 'accepted');
        accepted.forEach(relationship => {
            fetch('/api/relationships/' + relationship.id + '/notes', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
                .then(readJson).then(data => {
                    setNotes(current => ({ ...current, [relationship.id]: data as NotesPayload }));
                    if (data.today_note) setDrafts(current => current[relationship.id]?.trim() ? current : ({ ...current, [relationship.id]: data.today_note.body }));
                }).catch(() => undefined);
            fetch('/api/relationships/' + relationship.id + '/insights', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
                .then(readJson).then(data => { if (data.daily) setInsights(current => ({ ...current, [relationship.id]: data as InsightPayload })); })
                .catch(() => undefined);
        });
    }, [relationships]);

    async function invite(event: FormEvent) {
        event.preventDefault(); setBusy(true); setError(''); setNotice(''); setNewCode('');
        try {
            const response = await fetch('/api/relationships/invite', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() }, body: JSON.stringify({ relationship_type: kind }) });
            const data = await readJson(response);
            if (!response.ok) throw new Error(data.message ?? 'Could not create your invitation.');
            setNewCode(data.invite_code ?? '');
            setNotice('Your Cosmic Sync Code is ready. Your companion will accept it from their own account.');
            await load();
        } catch (exception) { setError(exception instanceof Error ? exception.message : 'Could not create your invitation.'); }
        finally { setBusy(false); }
    }

    async function accept(event: FormEvent) {
        event.preventDefault(); setBusy(true); setError(''); setNotice('');
        try {
            const response = await fetch('/api/relationships/accept', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() }, body: JSON.stringify({ invite_code: code.trim().toUpperCase() }) });
            const data = await readJson(response);
            if (!response.ok) throw new Error(data.message ?? 'Could not connect with that code.');
            setCode(''); window.history.replaceState({}, '', '/connections');
            setNotice('You are connected. Each person controls what they share.');
            await load();
        } catch (exception) { setError(exception instanceof Error ? exception.message : 'Could not accept that code.'); }
        finally { setBusy(false); }
    }

    async function saveNote(relationshipId: number) {
        const body = (drafts[relationshipId] ?? '').trim();
        if (!body) { setError('Write a little note before saving.'); return; }
        setSavingNote(relationshipId); setError(''); setNotice('');
        try {
            const response = await fetch('/api/relationships/' + relationshipId + '/notes', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() }, body: JSON.stringify({ body }) });
            const data = await readJson(response);
            if (!response.ok) throw new Error(data.message ?? data.errors?.body?.[0] ?? 'Could not save your note.');
            setNotice(data.message ?? 'Your little note has been saved.');
            const refreshed = await fetch('/api/relationships/' + relationshipId + '/notes', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(readJson) as NotesPayload;
            setNotes(current => ({ ...current, [relationshipId]: refreshed }));
        } catch (exception) { setError(exception instanceof Error ? exception.message : 'Could not save your note.'); }
        finally { setSavingNote(null); }
    }

    async function toggleSharing(relationship: Relationship, key: SharingKey) {
        const next = { ...relationship.sharing_preferences, [key]: !relationship.sharing_preferences[key] };
        setSavingSharing(relationship.id); setError('');
        try {
            const response = await fetch('/api/relationships/' + relationship.id + '/sharing', { method: 'PATCH', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() }, body: JSON.stringify({ [key]: next[key] }) });
            const data = await readJson(response);
            if (!response.ok) throw new Error(data.message ?? 'Could not update sharing preferences.');
            setRelationships(current => current.map(item => item.id === relationship.id ? { ...item, sharing_preferences: { ...emptySharing, ...data.sharing_preferences } } : item));
        } catch (exception) { setError(exception instanceof Error ? exception.message : 'Could not update sharing preferences.'); }
        finally { setSavingSharing(null); }
    }

    const accepted = relationships.filter(relationship => relationship.status === 'accepted');
    const pending = relationships.filter(relationship => relationship.status === 'pending');
    return <div className="cosmic-dashboard cosmic-connections-page">
        <header className="cosmic-header"><a className="cosmic-brand" href="/dashboard"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a><nav><a href="/dashboard">Home</a><a className="is-active" href="/connections">Connections</a><a href="/astrology">The Cosmic Atelier</a><a href="/profile">Profile & settings</a></nav><div className="cosmic-header__right"><a href="/dashboard">Back to home ↗</a></div></header>
        <main className="cosmic-main">
            <section className="cosmic-welcome cosmic-connections-welcome"><div><p className="cosmic-eyebrow">YOUR SPACE, YOUR BOUNDARIES</p><h1>Closer, <em>on your terms.</em></h1><p>Two accounts, two personal journeys, one shared space when you choose. Cycle and pregnancy details stay private until their owner chooses to share.</p><div className="cosmic-connection-promise"><span>✧</span> Consent first · Separate journeys · Gentle connection</div><p className="cosmic-own-journey">{profileRole === 'support' ? 'Your role · Support partner' : 'Your journey · ' + journeyLabel(ownJourney)}</p></div><div className="cosmic-welcome__art"><span>💌</span><i>✦</i></div></section>
            {error && <p role="alert" className="cosmic-toast is-error">{error}</p>}{notice && <p role="status" className="cosmic-toast">{notice}</p>}
            <div className="cosmic-connections-grid">
                {profileRole !== 'support' ? <section className="cosmic-week-card cosmic-connection-action"><p className="cosmic-eyebrow">INVITE SOMEONE YOU TRUST</p><h2>Create a Cosmic Sync Code</h2><p className="cosmic-muted">Choose the connection that fits. You can change what you share after they accept.</p>
                    <form className="cosmic-connection-form" onSubmit={invite}>
                        <button type="button" aria-pressed={kind === 'observer'} className={kind === 'observer' ? 'cosmic-connection-type is-selected' : 'cosmic-connection-type'} onClick={() => setKind('observer')}><span className="material-symbols-rounded">favorite</span><span><strong>Partner / support partner</strong><small>One-way daily notes from the person tracking their journey.</small></span><span className="cosmic-connection-check">{kind === 'observer' ? '✦' : '○'}</span></button>
                        <button type="button" aria-pressed={kind === 'co_tracker'} className={kind === 'co_tracker' ? 'cosmic-connection-type is-selected' : 'cosmic-connection-type'} onClick={() => setKind('co_tracker')}><span className="material-symbols-rounded">diversity_3</span><span><strong>Co-cycling / co-tracking partners</strong><small>Both people keep their own cycle, fertility or pregnancy profile.</small></span><span className="cosmic-connection-check">{kind === 'co_tracker' ? '✦' : '○'}</span></button>
                        <Button type="submit" disabled={busy}>{busy ? 'Preparing your code…' : 'Create invitation ✧'}</Button>
                    </form>
                    {newCode && <div className="cosmic-new-code"><span>Your Cosmic Sync Code</span><strong>{newCode}</strong><button type="button" onClick={() => { void navigator.clipboard?.writeText(newCode); setNotice('Code copied. Share it privately.'); }}>Copy code</button><small>Expires in seven days and can be accepted once.</small></div>}
                </section> : <section className="cosmic-week-card cosmic-connection-action"><p className="cosmic-eyebrow">YOUR SUPPORT ROLE</p><h2>You’re here to support your partner</h2><p className="cosmic-muted">You don’t need a reproductive tracking profile. Ask your partner for their Cosmic Sync Code and accept it here to connect your accounts.</p></section>}
                <section className="cosmic-week-card cosmic-connection-action"><p className="cosmic-eyebrow">ALREADY HAVE A CODE?</p><h2>Join a Crescent space</h2><p className="cosmic-muted">Sign in or register first. The code links accounts only after you accept it here.</p><form className="cosmic-connection-form" onSubmit={accept}><label className="cosmic-connection-code-field">8-character Cosmic Sync Code<input value={code} onChange={event => setCode(event.target.value.toUpperCase().slice(0, 8))} maxLength={8} minLength={8} required placeholder="MOONSTAR" autoCapitalize="characters" /></label><Button type="submit" disabled={busy || code.trim().length !== 8}>{busy ? 'Connecting…' : 'Accept invitation'}</Button></form></section>
            </div>
            <section className="cosmic-week-card cosmic-circle-section"><div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">YOUR LITTLE CIRCLE</p><h2>Your connections</h2><p className="cosmic-muted">Every connection has its own boundaries and shared space.</p></div><span className="cosmic-guide-stamp" aria-hidden="true">✿</span></div>
                {relationships.length === 0 && <div className="cosmic-connections-empty"><span>☾</span><h3>Your circle can begin whenever you’re ready.</h3><p>No connections yet. You can keep Crescent just for yourself or invite someone you trust.</p></div>}
                {pending.map(relationship => <article className="cosmic-pending-relationship" key={relationship.id}><span className="material-symbols-rounded">hourglass_top</span><div><strong>Invitation waiting</strong><p>{relationship.relationship_type === 'co_tracker' ? 'Co-cycling / co-tracking partner' : 'Partner / support partner'} · waiting for your companion to accept.</p>{relationship.invite_code && <small>Code: <strong>{relationship.invite_code}</strong></small>}</div></article>)}
                <div className="cosmic-connection-list">{accepted.map(relationship => {
                    const noteData = notes[relationship.id];
                    const insight = insights[relationship.id];
                    return <article className="cosmic-connection-card" key={relationship.id}>
                        <div className="cosmic-connection-card__header"><div className="cosmic-connection-avatar" aria-hidden="true">✿</div><div><p className="cosmic-eyebrow">{relationship.relationship_type === 'co_tracker' ? 'CO-TRACKING CONNECTION' : 'SUPPORT CONNECTION'}</p><h3>{relationship.companion_name ?? 'Your companion'}</h3><p className="cosmic-connection-journey">{journeyLabel(relationship.companion_journey)}</p></div><span className="cosmic-connection-status">Connected</span></div>
                        <div className="cosmic-sharing-panel"><div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">YOUR PERMISSIONS</p><h4>What you choose to share</h4></div><span aria-hidden="true">♡</span></div><p className="cosmic-muted">These settings control what your companion can see from your profile. Their own settings are separate.</p><div className="cosmic-sharing-options">{sharingOptions.map(option => <button key={option.key} type="button" disabled={savingSharing === relationship.id} aria-pressed={relationship.sharing_preferences[option.key]} className={relationship.sharing_preferences[option.key] ? 'cosmic-sharing-option is-enabled' : 'cosmic-sharing-option'} onClick={() => void toggleSharing(relationship, option.key)}><span className="material-symbols-rounded">{option.icon}</span><span><strong>{option.title}</strong><small>{option.detail}</small></span><span className="cosmic-sharing-toggle">{relationship.sharing_preferences[option.key] ? 'On' : 'Off'}</span></button>)}</div></div>
                        <div className="cosmic-note-panel"><div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">A LITTLE NOTE FOR YOU</p><h4>{relationship.relationship_type === 'co_tracker' ? 'Our daily notes' : 'A note from the heart'}</h4></div><span className="cosmic-guide-stamp" aria-hidden="true">♡</span></div><p className="cosmic-muted">{relationship.relationship_type === 'co_tracker' ? 'Each of you can leave one note per day. You can edit your own note by saving again.' : 'The person who started this support connection can write one note per day. The support partner can read it and see when it was opened.'}</p>
                            {noteData?.can_write && <div className="cosmic-note-compose"><label htmlFor={'note-'+relationship.id}>Your note for today</label><textarea id={'note-'+relationship.id} maxLength={1200} rows={3} value={drafts[relationship.id] ?? noteData.today_note?.body ?? ''} onChange={event => setDrafts(current => ({ ...current, [relationship.id]: event.target.value }))} placeholder="A little note about how you’re feeling, or what would help today…" /><div><small>{(drafts[relationship.id] ?? noteData.today_note?.body ?? '').length}/1200 · One note per day</small><Button type="button" disabled={savingNote === relationship.id || !(drafts[relationship.id] ?? noteData.today_note?.body ?? '').trim()} onClick={() => void saveNote(relationship.id)}>{savingNote === relationship.id ? 'Saving…' : noteData.today_note ? 'Update today’s note' : 'Send today’s note'}</Button></div></div>}
                            <div className="cosmic-note-list">{(noteData?.notes ?? []).slice().reverse().slice(0, 4).map(note => <article key={note.id} className={note.is_mine ? 'cosmic-note is-mine' : 'cosmic-note'}><div><strong>{note.is_mine ? 'You' : note.author_name}</strong><small>{dateLabel(note.note_date)}</small></div><p>{note.body}</p><small className="cosmic-note-read">{note.is_mine ? note.read_at ? 'Read by your companion' : 'Not read yet' : note.read_at ? 'Read' : 'New note'}</small></article>)}{noteData && noteData.notes.length === 0 && <p className="cosmic-muted cosmic-note-empty">Your little notes will live here, one day at a time.</p>}</div>
                        </div>
                        <div className="cosmic-daily-relationship"><div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">TODAY, TOGETHER</p><h4>{insight?.daily.title ?? 'Today’s relationship reflection'}</h4></div><span className="cosmic-guide-stamp" aria-hidden="true">✧</span></div><p>{insight?.daily.tip ?? 'A gentle reminder: ask what kind of support would feel good today, and listen without needing to fix everything.'}</p>{insight?.daily.transits?.length ? <div className="cosmic-transit-chips">{insight.daily.transits.map(transit => <span key={transit.name}>{transit.name}{transit.sign ? ' · ' + transit.sign : ''}</span>)}</div> : null}<small>{insight?.daily.transit_note ?? 'Daily insight will appear when the sky feed is available.'}</small>{insight?.daily.personal_transits?.length ? <div className="cosmic-personal-transit-list">{insight.daily.personal_transits.map((aspect, index) => <article key={aspect.left + aspect.right + index}><div><strong>{aspect.left} {aspect.aspect} {aspect.right}</strong><span>{aspect.orb.toFixed(1)}° orb</span></div><p>{aspect.text}</p></article>)}</div> : null}</div>
                        <div className="cosmic-compatibility-panel"><div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">THE TWO OF YOU, CELESTIALLY</p><h4>Cosmic compatibility</h4></div><span className="cosmic-guide-stamp" aria-hidden="true">☾</span></div><p className="cosmic-muted">{insight?.compatibility.summary ?? 'Your natal sign reflections will appear when the relevant profile details are available and shared.'}</p>{insight?.compatibility.available ? <><div className="cosmic-compatibility-themes">{insight.compatibility.themes.map(theme => <article key={theme.label}><div><strong>{theme.label}</strong><span>{theme.left} ✧ {theme.right}</span></div><p>{theme.text}</p></article>)}</div>{insight.compatibility.aspects?.length ? <div className="cosmic-synastry-aspects"><p className="cosmic-eyebrow">NATAL ASPECTS</p>{insight.compatibility.aspects.map((aspect, index) => <article key={aspect.left + aspect.right + index}><div><strong>{aspect.left} {aspect.aspect} {aspect.right}</strong><span>{aspect.orb.toFixed(1)}° orb</span></div><p>{aspect.text}</p></article>)}</div> : null}</> : <p className="cosmic-muted">Both people can enable Astrology in their sharing settings and add birth date and birthplace to explore these reflections together. Accurate birth time helps with time-sensitive placements.</p>}<small>Astrology is for reflection and entertainment, not a prediction or relationship diagnosis.</small></div>
                    </article>;
                })}</div>
            </section>
            <footer className="cosmic-footer"><a className="cosmic-brand" href="/dashboard"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a><p>Your journey, your boundaries, your little universe.</p><div><a href="/astrology">The Cosmic Atelier</a><a href="/profile">Profile & settings</a></div></footer>
        </main>
    </div>;
}
