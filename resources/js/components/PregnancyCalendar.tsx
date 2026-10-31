import { useEffect, useMemo, useState } from 'react';
import PregnancyCheckinForm from './PregnancyCheckinForm';
import { api, SYMPTOM_LABELS, type PregnancyCheckin, type PregnancyReminder } from '../utils/pregnancyApi';
import { addDays, addMonths, ageLabel, dayOfInstant, daysInMonth, gestationalAgeOn, monthStart, prettyDate, weekdayOf } from '../utils/pregnancyDates';
import { contentFor } from '../content/pregnancyContent';

type Props = { dueDate: string; today: string; timezone?: string; reminders: PregnancyReminder[]; refreshKey: number; onChanged: () => void };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Pregnancy-specific calendar: gestational age on every date, saved check-ins and reminders. No cycle or fertility maths. */
export default function PregnancyCalendar({ dueDate, today, timezone, reminders, refreshKey, onChanged }: Props) {
    const [month, setMonth] = useState(monthStart(today));
    const [selected, setSelected] = useState(today);
    const [checkins, setCheckins] = useState<Record<string, PregnancyCheckin>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [notice, setNotice] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let live = true; setLoading(true); setError('');
        const to = addDays(addMonths(month, 1), -1);
        api<{ checkins: PregnancyCheckin[] }>('/api/pregnancy/checkins?from=' + month + '&to=' + to)
            .then(r => { if (live) setCheckins(current => { const next = { ...current }; for (const key of Object.keys(next)) if (key >= month && key <= to) delete next[key]; for (const c of r.checkins) next[c.log_date] = c; return next; }); })
            .catch(e => { if (live) setError(e instanceof Error ? e.message : 'Your calendar could not load.'); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [month, refreshKey, attempt]);

    const remindersByDay = useMemo(() => {
        const map: Record<string, PregnancyReminder[]> = {};
        for (const r of reminders) (map[dayOfInstant(r.remind_at, timezone)] ??= []).push(r);
        return map;
    }, [reminders, timezone]);

    const age = gestationalAgeOn(dueDate, selected);
    const checkin = checkins[selected] ?? null;
    const dayReminders = remindersByDay[selected] ?? [];
    const content = contentFor(age.week, age.days);
    const blanks = weekdayOf(month);
    const cells = Array.from({ length: daysInMonth(month) }, (_, i) => addDays(month, i));
    const markers = (date: string) => {
        const a = gestationalAgeOn(dueDate, date);
        const out: string[] = [];
        if (date === dueDate) out.push('Estimated due date');
        if (a.dayInWeek === 0 && (a.week === 14 || a.week === 28)) out.push('Trimester ' + a.trimester + ' begins (estimated)');
        return out;
    };
    const selectedMarkers = markers(selected);
    const showMovement = age.week >= 16;

    return <section className="pcal" aria-labelledby="pcal-title">
        <div className="pcal-head">
            <h2 id="pcal-title">{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + 'T12:00:00Z'))}</h2>
            <div><button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>‹</button><button type="button" onClick={() => { setMonth(monthStart(today)); setSelected(today); }}>Today</button><button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>›</button></div>
        </div>
        {error && <p className="pregnancy-alert" role="alert">{error} <button type="button" onClick={() => setAttempt(n => n + 1)}>Try again</button></p>}
        <div className="pcal-legend" aria-label="Legend"><span><i className="dot dot--entry" /> Saved check-in</span><span><i className="dot dot--reminder" /> Appointment or reminder</span><span><i className="dot dot--est" /> Estimated milestone</span></div>
        <div className="pcal-grid" role="grid" aria-busy={loading}>
            {WEEKDAYS.map(d => <div key={d} className="pcal-dow" role="columnheader">{d}</div>)}
            {Array.from({ length: blanks }, (_, i) => <div key={'b' + i} />)}
            {cells.map(date => {
                const a = gestationalAgeOn(dueDate, date);
                const inRange = date >= addDays(dueDate, -280) && date <= addDays(dueDate, 14);
                const has = checkins[date]; const rem = remindersByDay[date]; const mk = markers(date);
                return <button type="button" key={date} role="gridcell" aria-selected={date === selected} aria-current={date === today ? 'date' : undefined}
                    className={['pcal-day', date === selected ? 'is-selected' : '', date === today ? 'is-today' : '', 't' + a.trimester].join(' ')}
                    onClick={() => { setSelected(date); setEditing(false); setNotice(''); }}
                    aria-label={prettyDate(date) + (inRange ? ', ' + ageLabel(a) : '') + (has ? ', check-in saved' : '') + (rem ? ', ' + rem.length + ' reminder' + (rem.length > 1 ? 's' : '') : '')}>
                    <span className="pcal-num">{Number(date.slice(8))}</span>
                    {inRange && <small>{a.week}w{a.dayInWeek}</small>}
                    <span className="pcal-dots">{has && <i className="dot dot--entry" />}{rem && <i className="dot dot--reminder" />}{mk.length > 0 && <i className="dot dot--est" />}</span>
                </button>;
            })}
        </div>
        <article className="pcal-panel" aria-live="polite">
            <h3>{prettyDate(selected, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
            <p className="pcal-age"><strong>{ageLabel(age)}</strong> · trimester {age.trimester} · {age.days} days · {age.daysUntilDue > 0 ? age.daysUntilDue + ' days to estimated due date' : age.daysUntilDue === 0 ? 'estimated due date' : -age.daysUntilDue + ' days past estimated due date'}</p>
            {selectedMarkers.length > 0 && <p className="pview-tag">{selectedMarkers.join(' · ')}</p>}
            {notice && <p className="pregnancy-notice" role="status">{notice}</p>}
            {!editing && (checkin
                ? <div className="pcal-entry"><h4>Your entry</h4>
                    <p>{checkin.symptoms.length ? checkin.symptoms.map(s => SYMPTOM_LABELS[s] ?? s).join(', ') : 'No symptoms logged.'}</p>
                    <p>{[checkin.mood && 'Mood: ' + checkin.mood, checkin.energy_level && 'Energy: ' + checkin.energy_level].filter(Boolean).join(' · ')}</p>
                    {checkin.notes && <blockquote>{checkin.notes}</blockquote>}</div>
                : <p className="pview-empty">{selected > today ? 'Future days cannot hold entries yet.' : 'No entry saved for this day.'}</p>)}
            {selected <= today && !editing && <button type="button" className="pview-link" onClick={() => setEditing(true)}>{checkin ? 'Edit this entry' : 'Add an entry for this day'}</button>}
            {editing && <PregnancyCheckinForm date={selected} existing={checkin} showMovement={showMovement} onSaved={(saved, message) => { setCheckins(c => { const n = { ...c }; if (saved) n[selected] = saved; else delete n[selected]; return n; }); setEditing(false); setNotice(message); onChanged(); }} />}
            <h4>Appointments &amp; reminders</h4>
            {dayReminders.length ? <ul className="pview-list">{dayReminders.map(r => <li key={r.id}><div><strong>{r.title}</strong> {r.share_with_partner && <span className="pview-tag">Shared</span>}<br /><time dateTime={r.remind_at}>{new Date(r.remind_at).toLocaleTimeString(undefined, { timeStyle: 'short', timeZone: timezone })}</time> {r.completed_at ? '· done' : ''}</div></li>)}</ul> : <p className="pview-empty">None on this day.</p>}
            <h4>Development around this date</h4>
            <p><strong>{content.weekly.heading}</strong>{!content.isExactWeek && ' (ongoing)'}: {content.weekly.body}</p>
            <small>Source: <a href={content.weekly.source.url} target="_blank" rel="noreferrer">{content.weekly.source.name}</a>. Dates in the calendar are estimates from your saved dating and may be revised by your care team.</small>
        </article>
    </section>;
}
