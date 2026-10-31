import { useEffect, useState } from 'react';
import { api, SYMPTOM_LABELS, type PregnancyCheckin } from '../utils/pregnancyApi';
import { addDays } from '../utils/pregnancyDates';

const MIN_ENTRIES = 5;

/** Trends computed only from saved check-ins in the last 28 days. No improvement/decline claims are made. */
export default function PregnancyTrends({ today, refreshKey }: { today: string; refreshKey: number }) {
    const [entries, setEntries] = useState<PregnancyCheckin[] | null>(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let live = true; setEntries(null); setError('');
        api<{ checkins: PregnancyCheckin[] }>('/api/pregnancy/checkins?from=' + addDays(today, -27) + '&to=' + today)
            .then(r => { if (live) setEntries(r.checkins); }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Trends could not load.'); });
        return () => { live = false; };
    }, [today, refreshKey]);

    if (error) return <p className="pregnancy-alert" role="alert">{error}</p>;
    if (!entries) return <p role="status">Gathering your entries…</p>;
    if (entries.length === 0) return <p className="pview-empty">No entries in the last 28 days yet. Trends appear here once you have logged a few days.</p>;

    const count = <T,>(values: (T | null | undefined)[]) => values.reduce<Map<T, number>>((m, v) => v ? m.set(v, (m.get(v) ?? 0) + 1) : m, new Map());
    const symptomCounts = [...count(entries.flatMap(e => e.symptoms)).entries()].sort((a, b) => b[1] - a[1]);
    const moods = [...count(entries.map(e => e.mood)).entries()].sort((a, b) => b[1] - a[1]);
    const energy = count(entries.map(e => e.energy_level));
    const sleep = count(entries.map(e => (e.details as { sleep_quality?: string } | undefined)?.sleep_quality));
    const weekEntries = entries.filter(e => e.log_date >= addDays(today, -6));
    const weekSymptoms = new Set(weekEntries.flatMap(e => e.symptoms)).size;
    const bar = (label: string, n: number, max: number) => <li key={label}><span>{label}</span><i style={{ width: Math.max(6, (n / max) * 100) + '%' }} /><b>{n}</b></li>;

    return <div className="ptrends">
        <p className="pview-lede">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} in the last 28 days · {weekEntries.length} in the last 7 · {weekSymptoms} different symptom{weekSymptoms === 1 ? '' : 's'} this week</p>
        {entries.length < MIN_ENTRIES && <p className="pview-note">With fewer than {MIN_ENTRIES} entries these counts are only a record of what you logged, not a pattern.</p>}
        <div className="ptrends-grid">
            <section><h3>Most logged symptoms</h3>{symptomCounts.length ? <ul className="ptrends-bars">{symptomCounts.slice(0, 6).map(([k, n]) => bar(SYMPTOM_LABELS[k] ?? k, n, symptomCounts[0][1]))}</ul> : <p>No symptoms logged.</p>}</section>
            <section><h3>Mood</h3>{moods.length ? <ul className="ptrends-bars">{moods.map(([k, n]) => bar(k, n, moods[0][1]))}</ul> : <p>No mood entries.</p>}</section>
            <section><h3>Energy</h3><ul className="ptrends-bars">{(['low', 'balanced', 'high'] as const).filter(k => energy.has(k)).map(k => bar(k === 'low' ? 'Resting' : k === 'balanced' ? 'Steady' : 'Bright', energy.get(k) ?? 0, entries.length))}</ul>{energy.size === 0 && <p>No energy entries.</p>}</section>
            <section><h3>Sleep observations</h3><ul className="ptrends-bars">{(['poor', 'fair', 'good'] as const).filter(k => sleep.has(k)).map(k => bar(k, sleep.get(k) ?? 0, entries.length))}</ul>{sleep.size === 0 && <p>No sleep entries.</p>}</section>
        </div>
        <section><h3>Your timeline</h3><ol className="ptrends-timeline">{[...entries].reverse().slice(0, 14).map(e => <li key={e.log_date}><time dateTime={e.log_date}>{e.log_date}</time> {e.mood ?? ''} {e.energy_level ? '· energy ' + e.energy_level : ''} {e.symptoms.length ? '· ' + e.symptoms.map(s => SYMPTOM_LABELS[s] ?? s).join(', ') : ''}</li>)}</ol></section>
    </div>;
}
