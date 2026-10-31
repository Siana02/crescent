import { useEffect, useState, type FormEvent } from 'react';
import Button from './Button';
import { api, SYMPTOM_GROUPS, type CheckinDetails, type PregnancyCheckin } from '../utils/pregnancyApi';

const MOODS = ['calm', 'happy', 'tender', 'anxious', 'overwhelmed', 'irritable', 'hopeful', 'tired'];
const ENERGIES = [['low', 'Resting'], ['balanced', 'Steady'], ['high', 'Bright']] as const;
const SEVERITY = [[1, 'Mild'], [2, 'Moderate'], [3, 'Strong']] as const;
const DURATION = [['brief', 'Briefly'], ['part_of_day', 'Part of the day'], ['all_day', 'All day']] as const;
const FREQUENCY = [['once', 'Once'], ['a_few_times', 'A few times'], ['constant', 'Constant']] as const;
const SLEEP = [['poor', 'Poor'], ['fair', 'Fair'], ['good', 'Good']] as const;

type Props = {
    date: string;
    existing: PregnancyCheckin | null;
    /** Movement observations are only offered once movements are commonly noticed. */
    showMovement: boolean;
    onSaved: (checkin: PregnancyCheckin | null, message: string) => void;
};

export default function PregnancyCheckinForm({ date, existing, showMovement, onSaved }: Props) {
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [mood, setMood] = useState('');
    const [energy, setEnergy] = useState('');
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<CheckinDetails>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSymptoms(existing?.symptoms ?? []); setMood(existing?.mood ?? ''); setEnergy(existing?.energy_level ?? '');
        setNotes(existing?.notes ?? ''); setDetails((existing?.details as CheckinDetails) ?? {}); setError('');
    }, [existing, date]);

    const toggle = (key: string) => setSymptoms(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
    const setDetail = (kind: 'severity' | 'duration' | 'frequency', symptom: string, value: string | number) =>
        setDetails(current => ({ ...current, [kind]: { ...(current[kind] as Record<string, unknown> | undefined), [symptom]: value } }));

    async function save(event: FormEvent) {
        event.preventDefault(); setError('');
        if (!symptoms.length && !mood && !energy && !notes.trim() && !details.sleep_quality) { setError('Choose one little thing to log first.'); return; }
        setBusy(true);
        try {
            const body = { symptoms, mood: mood || null, energy_level: energy || null, notes: notes.trim() || null, details };
            const result = existing
                ? await api<{ message: string; checkin: PregnancyCheckin }>('/api/pregnancy/checkins/' + date, 'PUT', body)
                : await api<{ message: string; checkin: PregnancyCheckin }>('/api/pregnancy/checkins', 'POST', { ...body, log_date: date });
            onSaved(result.checkin, result.message);
        } catch (e) { setError(e instanceof Error ? e.message : 'Your entry could not be saved.'); } finally { setBusy(false); }
    }
    async function remove() {
        if (!existing || !window.confirm('Remove this day’s entry? This cannot be undone.')) return;
        setBusy(true); setError('');
        try { const result = await api<{ message: string }>('/api/pregnancy/checkins/' + date, 'DELETE'); onSaved(null, result.message); }
        catch (e) { setError(e instanceof Error ? e.message : 'Your entry could not be removed.'); } finally { setBusy(false); }
    }
    const chips = <T extends string | number>(label: string, options: readonly (readonly [T, string])[], value: T | undefined, pick: (value: T) => void) =>
        <div className="pcheck-chips" role="group" aria-label={label}>{options.map(([v, text]) => <button type="button" key={String(v)} aria-pressed={value === v} className={value === v ? 'is-selected' : ''} onClick={() => pick(v)}>{text}</button>)}</div>;

    return <form className="pcheck" onSubmit={save}>
        {SYMPTOM_GROUPS.map(group => {
            const items = group.items.filter(([key]) => showMovement || key !== 'movement_noticed');
            return <fieldset key={group.title}><legend>{group.title}</legend>
                <div className="pcheck-grid">{items.map(([key, label]) => <button type="button" key={key} aria-pressed={symptoms.includes(key)} className={symptoms.includes(key) ? 'pregnancy-symptom is-selected' : 'pregnancy-symptom'} onClick={() => toggle(key)}>{label}</button>)}</div>
            </fieldset>;
        })}
        {symptoms.filter(key => key !== 'movement_noticed' && key !== 'other_observation' && key !== 'hopefulness').length > 0 && <fieldset className="pcheck-details"><legend>Optional: tell us more about each</legend>
            {symptoms.filter(key => key !== 'movement_noticed' && key !== 'other_observation' && key !== 'hopefulness').map(key => <div key={key} className="pcheck-detail">
                <strong>{SYMPTOM_GROUPS.flatMap(g => g.items).find(([k]) => k === key)?.[1]}</strong>
                {chips('Severity', SEVERITY, details.severity?.[key], v => setDetail('severity', key, v))}
                {chips('Duration', DURATION, details.duration?.[key], v => setDetail('duration', key, v))}
                {chips('Frequency', FREQUENCY, details.frequency?.[key], v => setDetail('frequency', key, v))}
            </div>)}
        </fieldset>}
        <fieldset><legend>Sleep last night</legend>{chips('Sleep quality', SLEEP, details.sleep_quality as 'poor' | 'fair' | 'good' | undefined, v => setDetails(c => ({ ...c, sleep_quality: c.sleep_quality === v ? undefined : v })))}</fieldset>
        <fieldset><legend>Mood</legend><div className="pregnancy-mood-row">{MOODS.map(item => <button type="button" key={item} aria-pressed={mood === item} className={mood === item ? 'pregnancy-mood is-selected' : 'pregnancy-mood'} onClick={() => setMood(c => c === item ? '' : item)}>{item}</button>)}</div></fieldset>
        <fieldset><legend>Energy</legend><div className="pregnancy-energy-row">{ENERGIES.map(([v, text]) => <button type="button" key={v} aria-pressed={energy === v} className={energy === v ? 'pregnancy-energy is-selected' : 'pregnancy-energy'} onClick={() => setEnergy(c => c === v ? '' : v)}>{text}</button>)}</div></fieldset>
        <label className="pregnancy-notes">Personal notes <small>Private · up to 1,000 characters</small><textarea rows={3} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        {error && <p className="pregnancy-alert" role="alert">{error}</p>}
        <div className="pcheck-actions"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : existing ? 'Update this entry ✧' : 'Save entry ✧'}</Button>{existing && <Button type="button" variant="outline" onClick={remove} disabled={busy}>Remove entry</Button>}</div>
    </form>;
}
