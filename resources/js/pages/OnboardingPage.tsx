import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Button from '../components/Button';
import '../styles/onboarding.css';

type Goal = 'track_cycle' | 'cosmic_cycle' | 'fertility_support' | 'manage_symptoms' | 'trying_to_conceive' | 'pregnancy_support';
type PartnerPreference = 'solo' | 'observer' | 'co_tracker';
type Regularity = 'regular' | 'irregular' | 'unknown';
type PregnancyDateSource = 'due_date' | 'last_period_date' | 'conception_date';

type ApiError = { message?: string; errors?: Record<string, string[]> };
type InviteResponse = { invite_code?: string; message?: string; errors?: Record<string, string[]> };

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}
function firstError(result: ApiError, fallback: string): string {
    return (result.errors ? Object.values(result.errors)[0]?.[0] : undefined) ?? result.message ?? fallback;
}

const STEPS = [
    { eyebrow: 'YOUR INTENTION', title: 'What brings you to Crescent?', subtitle: 'Your space should feel like you. Choose what you want it to hold.' },
    { eyebrow: 'YOUR LITTLE UNIVERSE', title: 'Tell us a little about you', subtitle: 'Share only what feels comfortable. You can change your details later.' },
    { eyebrow: 'YOUR MENSTRUAL BLUEPRINT', title: 'Let’s map your natural flow', subtitle: 'Estimates become more useful with your own history. “I don’t know” is always a valid answer.' },
    { eyebrow: 'YOUR CONNECTION', title: 'Track solo or invite a companion?', subtitle: 'You are always in control of your information. Nothing is shared just because you connect.' },
];

function ChoiceCard({ selected, icon, title, description, onClick }: { selected: boolean; icon: string; title: string; description: string; onClick: () => void }) {
    return <button type="button" className={`onboarding-choice ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={onClick}>
        <span className="onboarding-choice__icon" aria-hidden="true">{icon}</span>
        <span className="onboarding-choice__copy"><strong>{title}</strong><small>{description}</small></span>
        <span className="onboarding-choice__check" aria-hidden="true">{selected ? '✦' : '○'}</span>
    </button>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return <label className="onboarding-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}


function dateParts(value: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}
function localDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function CalendarField({ label, hint, value, onChange, maxDate, minDate }: {
    label: string; hint?: string; value: string; onChange: (value: string) => void;
    maxDate?: string; minDate?: string;
}) {
    const [open, setOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(() => {
        const initial = dateParts(value) ?? new Date();
        return new Date(initial.getFullYear(), initial.getMonth(), 1);
    });
    useEffect(() => {
        if (value) {
            const selected = dateParts(value);
            if (selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
        }
    }, [value]);
    const monthName = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const offset = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
    const dayCount = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const today = localDateString(new Date());
    const days = Array.from({ length: offset + dayCount }, (_, index) => index < offset ? null : index - offset + 1);
    return <div className="onboarding-calendar-field">
        <span className="onboarding-calendar-label">{label}</span>
        <button type="button" className={`onboarding-calendar-trigger ${value ? 'has-date' : ''}`} aria-expanded={open} onClick={() => setOpen(current => !current)}>
            <span className="onboarding-calendar-trigger__moon" aria-hidden="true">☾</span>
            <span><strong>{dateParts(value)?.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) ?? 'Choose a day in your cycle'}</strong><small>{value ? 'Tap to change your date' : 'Open your little moon calendar'}</small></span>
            <span className="onboarding-calendar-trigger__icon" aria-hidden="true">✿</span>
        </button>
        {hint && <small className="onboarding-calendar-hint">{hint}</small>}
        {open && <div className="onboarding-calendar-popover">
            <div className="onboarding-calendar-heading">
                <button type="button" aria-label="Previous month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>‹</button>
                <div><small>YOUR CYCLE, YOUR TIME</small><strong>{monthName}</strong></div>
                <button type="button" aria-label="Next month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="onboarding-calendar-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={day + index}>{day}</span>)}</div>
            <div className="onboarding-calendar-days">
                {days.map((day, index) => {
                    if (day === null) return <span key={`blank-${index}`} className="onboarding-calendar-blank" />;
                    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
                    const iso = localDateString(date);
                    const disabled = (!!maxDate && iso > maxDate) || (!!minDate && iso < minDate);
                    const selected = iso === value;
                    return <button type="button" key={iso} disabled={disabled} aria-pressed={selected} className={`onboarding-calendar-day ${selected ? 'is-selected' : ''} ${iso === today ? 'is-today' : ''}`} onClick={() => { onChange(iso); setOpen(false); }}>
                        <span>{day}</span>{selected && <i aria-hidden="true">✿</i>}
                    </button>;
                })}
            </div>
            <div className="onboarding-calendar-footer"><span>✧ Every date is part of your story</span>{value && <button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear date</button>}</div>
        </div>}
    </div>;
}

function BirthTimeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const [hour, setHour] = useState(() => { const h = Number(value.split(':')[0] || 0); return String(h % 12 || 12); });
    const [minute, setMinute] = useState(() => value.split(':')[1] || '00');
    const [period, setPeriod] = useState(() => Number(value.split(':')[0] || 0) >= 12 ? 'PM' : 'AM');
    useEffect(() => {
        const [rawHour, rawMinute] = value ? value.split(':') : ['', '00'];
        if (rawHour !== '') { const h = Number(rawHour); setHour(String(h % 12 || 12)); setMinute(rawMinute || '00'); setPeriod(h >= 12 ? 'PM' : 'AM'); }
    }, [value]);
    function update(nextHour: string, nextMinute: string, nextPeriod: string) {
        const h = (Number(nextHour) % 12) + (nextPeriod === 'PM' ? 12 : 0);
        onChange(`${String(h).padStart(2, '0')}:${nextMinute}`);
    }
    return <div className="onboarding-clock">
        <span className="onboarding-clock__face" aria-hidden="true">◷</span>
        <select aria-label="Birth hour" value={hour} onChange={event => { setHour(event.target.value); update(event.target.value, minute, period); }}>{Array.from({ length: 12 }, (_, i) => String(i + 1)).map(item => <option key={item} value={item}>{item}</option>)}</select>
        <span className="onboarding-clock__colon">:</span>
        <select aria-label="Birth minute" value={minute} onChange={event => { setMinute(event.target.value); update(hour, event.target.value, period); }}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(item => <option key={item} value={item}>{item}</option>)}</select>
        <select aria-label="AM or PM" value={period} onChange={event => { setPeriod(event.target.value); update(hour, minute, event.target.value); }}><option>AM</option><option>PM</option></select>
    </div>;
}

const CONTRACEPTION_CHOICES = [
    { value: 'none', icon: '🌿', title: 'None — natural tracking', detail: 'I’m not using contraception' },
    { value: 'pill', icon: '🌸', title: 'The pill', detail: 'Hormonal oral contraception' },
    { value: 'patch', icon: '🩹', title: 'Patch', detail: 'Hormonal patch' },
    { value: 'ring', icon: '⭕', title: 'Vaginal ring', detail: 'Hormonal ring' },
    { value: 'implant', icon: '✨', title: 'Implant', detail: 'Hormonal implant' },
    { value: 'injection', icon: '💉', title: 'Injection', detail: 'Hormonal injection' },
    { value: 'hormonal_iud', icon: '🌙', title: 'Hormonal IUD', detail: 'Hormonal coil' },
    { value: 'copper_iud', icon: '🪷', title: 'Copper IUD', detail: 'Non-hormonal coil' },
    { value: 'other', icon: '🫧', title: 'Other / barrier method', detail: 'Another method' },
    { value: 'prefer_not_to_say', icon: '🤍', title: 'I’d rather not say', detail: 'This can stay private' },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const [goal, setGoal] = useState<Goal>(() => new URLSearchParams(window.location.search).get('journey') === 'pregnancy' ? 'pregnancy_support' : 'track_cycle');
    const [wantsAstrology, setWantsAstrology] = useState(false);
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthTimeUnknown, setBirthTimeUnknown] = useState(true);
    const [birthPlace, setBirthPlace] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [cycleLengthUnknown, setCycleLengthUnknown] = useState(false);
    const [cycleLength, setCycleLength] = useState('28');
    const [regularity, setRegularity] = useState<Regularity>('unknown');
    const [contraception, setContraception] = useState('prefer_not_to_say');
    const [partnerPreference, setPartnerPreference] = useState<PartnerPreference>('solo');
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [acceptCode, setAcceptCode] = useState('');
    const [connectionNotice, setConnectionNotice] = useState('');
    const [pregnancyDateSource, setPregnancyDateSource] = useState<PregnancyDateSource>('due_date');
    const [pregnancyDueDate, setPregnancyDueDate] = useState('');
    const [pregnancyLastPeriodDate, setPregnancyLastPeriodDate] = useState('');
    const [pregnancyConceptionDate, setPregnancyConceptionDate] = useState('');
    const [wantsBabyAstrology, setWantsBabyAstrology] = useState(false);
    const pregnancyJourney = goal === 'pregnancy_support';
    const activeSteps = pregnancyJourney ? [STEPS[0], STEPS[1], { eyebrow: 'YOUR PREGNANCY JOURNEY', title: 'A little life, a whole new universe', subtitle: 'We’ll use the date you know best to estimate your stage. Your maternity care team remains your source for medical guidance.' }, STEPS[3]] : STEPS;

    useEffect(() => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        fetch(`/api/dashboard?timezone=${encodeURIComponent(timezone)}`, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        }).then(async response => {
            if (!response.ok) return;
            const profile = await response.json() as {
                user?: { name?: string };
                profile?: {
                    display_name?: string | null; primary_goal?: Goal; wants_astrology?: boolean;
                    birth_date?: string | null; birth_time?: string | null; birth_place?: string | null;
                    average_cycle_length?: number | null; average_period_length?: number | null;
                    cycle_regularity?: Regularity; contraception_type?: string | null;
                    partner_preference?: PartnerPreference; active_journey?: 'cycle' | 'fertility' | 'pregnancy' | 'postpartum';
                };
                pregnancy?: { due_date?: string; last_period_date?: string | null; conception_date?: string | null; due_date_source?: PregnancyDateSource; wants_baby_astrology?: boolean } | null;
                latest_period?: { start_date: string; end_date: string | null } | null;
            };
            setDisplayName(profile.profile?.display_name || profile.user?.name || '');
            if (new URLSearchParams(window.location.search).get('journey') === 'pregnancy') setGoal('pregnancy_support');
            else if (profile.profile?.primary_goal) setGoal(profile.profile.primary_goal);
            if (profile.profile?.wants_astrology) setWantsAstrology(true);
            setBirthDate(profile.profile?.birth_date ?? '');
            setBirthTime(profile.profile?.birth_time?.slice(0, 5) ?? '');
            setBirthTimeUnknown(!profile.profile?.birth_time);
            setBirthPlace(profile.profile?.birth_place ?? '');
            setCycleLength(profile.profile?.average_cycle_length ? String(profile.profile.average_cycle_length) : '28');
            setCycleLengthUnknown(profile.profile?.average_cycle_length == null);
            setRegularity(profile.profile?.cycle_regularity ?? 'unknown');
            setContraception(profile.profile?.contraception_type ?? 'prefer_not_to_say');
            setPartnerPreference(profile.profile?.partner_preference ?? 'solo');
            setPeriodStart(profile.latest_period?.start_date ?? '');
            setPeriodEnd(profile.latest_period?.end_date ?? '');
            if (profile.pregnancy) {
                setPregnancyDueDate(profile.pregnancy.due_date ?? '');
                setPregnancyLastPeriodDate(profile.pregnancy.last_period_date ?? '');
                setPregnancyConceptionDate(profile.pregnancy.conception_date ?? '');
                setPregnancyDateSource(profile.pregnancy.due_date_source ?? 'due_date');
                setWantsBabyAstrology(profile.pregnancy.wants_baby_astrology ?? false);
            }
        }).catch(() => {
            // Onboarding remains usable even if prefill data cannot be loaded.
        });
    }, []);

    function chooseGoal(next: Goal) {
        setGoal(next);
        if (next === 'cosmic_cycle') setWantsAstrology(true);
    }

    async function saveOnboarding(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (step < activeSteps.length - 1) { setStep(current => current + 1); setError(''); return; }
        setError('');
        if (!pregnancyJourney && periodEnd && !periodStart) { setError('Add your period start date too, or leave both dates blank.'); return; }
        if (!pregnancyJourney && periodStart && periodEnd && periodEnd < periodStart) { setError('Your period end date cannot be before its start date.'); return; }
        if (pregnancyJourney && pregnancyDateSource === 'due_date' && !pregnancyDueDate) { setError('Choose your estimated due date to open your pregnancy journey.'); return; }
        if (pregnancyJourney && pregnancyDateSource === 'last_period_date' && !pregnancyLastPeriodDate) { setError('Choose the first day of your last period, or select another date option.'); return; }
        if (pregnancyJourney && pregnancyDateSource === 'conception_date' && !pregnancyConceptionDate) { setError('Choose your estimated conception date, or select another date option.'); return; }

        setIsSaving(true);
        setIsProcessing(true);
        const headers = { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() };
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        try {
            const profileResponse = await fetch('/api/cycle-profile', {
                method: 'PUT', credentials: 'same-origin', headers,
                body: JSON.stringify({
                    display_name: displayName.trim() || null,
                    primary_goal: goal,
                    active_journey: pregnancyJourney ? 'pregnancy' : (goal === 'trying_to_conceive' || goal === 'fertility_support' ? 'fertility' : 'cycle'),
                    wants_astrology: wantsAstrology,
                    birth_date: birthDate || null,
                    birth_time: wantsAstrology && !birthTimeUnknown && birthTime ? birthTime : null,
                    birth_place: wantsAstrology ? birthPlace.trim() || null : null,
                    average_cycle_length: pregnancyJourney || cycleLengthUnknown ? null : Number(cycleLength),
                    average_period_length: !pregnancyJourney && periodStart && periodEnd ? Math.round((new Date(`${periodEnd}T12:00:00`).getTime() - new Date(`${periodStart}T12:00:00`).getTime()) / 86400000) + 1 : null,
                    cycle_regularity: pregnancyJourney ? 'unknown' : regularity,
                    contraception_type: pregnancyJourney ? 'prefer_not_to_say' : contraception,
                    partner_preference,
                    timezone,
                    onboarding_completed: !pregnancyJourney,
                }),
            });
            const profileResult = (await profileResponse.json()) as ApiError;
            if (!profileResponse.ok) throw new Error(firstError(profileResult, 'We could not save your details just yet.'));
            if (pregnancyJourney) {
                const pregnancyResponse = await fetch('/api/pregnancy', {
                    method: 'PUT', credentials: 'same-origin', headers,
                    body: JSON.stringify({
                        due_date_source: pregnancyDateSource,
                        due_date: pregnancyDateSource === 'due_date' ? pregnancyDueDate : null,
                        last_period_date: pregnancyDateSource === 'last_period_date' ? pregnancyLastPeriodDate : null,
                        conception_date: pregnancyDateSource === 'conception_date' ? pregnancyConceptionDate : null,
                        wants_baby_astrology: wantsBabyAstrology,
                    }),
                });
                const pregnancyResult = (await pregnancyResponse.json()) as ApiError;
                if (!pregnancyResponse.ok) throw new Error(firstError(pregnancyResult, 'We could not prepare your pregnancy space just yet.'));
            }
            if (!pregnancyJourney && periodStart) {
                const periodResponse = await fetch('/api/periods', {
                    method: 'POST', credentials: 'same-origin', headers,
                    body: JSON.stringify({ start_date: periodStart, end_date: periodEnd || null }),
                });
                const periodResult = (await periodResponse.json()) as ApiError;
                if (!periodResponse.ok) throw new Error(firstError(periodResult, 'Your period dates could not be saved.'));
            }
            if (acceptCode.trim()) {
                const acceptResponse = await fetch('/api/relationships/accept', {
                    method: 'POST', credentials: 'same-origin', headers,
                    body: JSON.stringify({ invite_code: acceptCode.trim().toUpperCase() }),
                });
                const acceptResult = (await acceptResponse.json()) as InviteResponse;
                if (!acceptResponse.ok) throw new Error(firstError(acceptResult, 'That Cosmic Sync Code could not be accepted.'));
                setConnectionNotice(acceptResult.message ?? 'Your Crescent spaces are connected. ✨');
            } else if (partnerPreference !== 'solo') {
                const inviteResponse = await fetch('/api/relationships/invite', {
                    method: 'POST', credentials: 'same-origin', headers,
                    body: JSON.stringify({ relationship_type: partnerPreference }),
                });
                const inviteResult = (await inviteResponse.json()) as InviteResponse;
                if (!inviteResponse.ok) throw new Error(firstError(inviteResult, 'Your Cosmic Sync Code could not be created.'));
                setInviteCode(inviteResult.invite_code ?? '');
            }
            if (partnerPreference === 'solo' && !acceptCode.trim()) window.setTimeout(() => window.location.assign('/dashboard'), 1800);
        } catch (e) {
            setIsProcessing(false);
            setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }

    if (isProcessing) {
        return <main className="onboarding-processing">
            <div className="onboarding-orbit" aria-hidden="true"><span>☾</span><i>✦</i><b>✧</b></div>
            <p className="onboarding-eyebrow">A LITTLE COSMIC MAGIC</p>
            <h1>Gathering your little universe…</h1>
            <p>Setting up your cycle space and making room for what matters to you.</p>
            {connectionNotice && <div className="onboarding-invite"><span>Connection made ✨</span><strong>{connectionNotice}</strong><small>Your cycle details remain private until sharing is explicitly enabled.</small><button type="button" className="onboarding-dashboard-link" onClick={() => window.location.assign('/dashboard')}>Enter my dashboard →</button></div>}
            {inviteCode && <div className="onboarding-invite"><span>Your Cosmic Sync Code</span><strong>{inviteCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copy code</button><small>Share this with your companion. Your cycle details stay private until you choose to share them.</small><button type="button" className="onboarding-dashboard-link" onClick={() => window.location.assign('/dashboard')}>Enter my dashboard →</button></div>}
        </main>;
    }

    const current = activeSteps[step] ?? activeSteps[0];
    return <main className="onboarding-shell">
        <div className="onboarding-sky" aria-hidden="true"><span>✦</span><span>✧</span><span>☾</span><span>✷</span><span>✦</span><span>❀</span><span>✧</span></div>
        <header className="onboarding-header">
            <a className="onboarding-brand" href="/" aria-label="Crescent home"><span>☾</span> crescent<span>.</span></a>
            <span className="onboarding-save-note">A private space, made for you ✿</span>
        </header>
        <section className="onboarding-card" aria-labelledby="onboarding-title">
            <div className="onboarding-card__art">
                <div className="onboarding-art-orbit onboarding-art-orbit--outer"></div>
                <div className="onboarding-art-orbit onboarding-art-orbit--inner"></div>
                <div className="onboarding-art-moon">☾</div>
                <span className="onboarding-art-star onboarding-art-star--one">✦</span>
                <span className="onboarding-art-star onboarding-art-star--two">✧</span>
                <span className="onboarding-art-flower">❀</span>
                <p>Soft rituals.<br /><em>Real you.</em></p>
                <small>YOUR BODY · YOUR RHYTHM · YOUR MAGIC</small>
            </div>
            <div className="onboarding-card__content">
                <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${activeSteps.length}`}>
                    {activeSteps.map((item, index) => <span key={item.eyebrow} className={index <= step ? 'is-complete' : ''}></span>)}
                </div>
                <p className="onboarding-eyebrow">{current.eyebrow} · STEP {step + 1} OF {activeSteps.length}</p>
                <h1 id="onboarding-title">{current.title}</h1>
                <p className="onboarding-subtitle">{current.subtitle}</p>
                <form onSubmit={saveOnboarding} className="onboarding-form">
                    {step === 0 && <div className="onboarding-choices">
                        <ChoiceCard selected={goal === 'track_cycle'} icon="🌿" title="Just tracking my body & cycle" description="Period dates, symptoms, moods and patterns." onClick={() => chooseGoal('track_cycle')} />
                        <ChoiceCard selected={goal === 'cosmic_cycle'} icon="🌙" title="Syncing my cycle with the cosmos" description="Cycle tracking with astrology and lunar notes." onClick={() => chooseGoal('cosmic_cycle')} />
                        <ChoiceCard selected={goal === 'trying_to_conceive' || goal === 'fertility_support'} icon="🌸" title="I’m trying to conceive" description="Fertility awareness, cycle history and estimated fertile windows." onClick={() => chooseGoal('trying_to_conceive')} />
                        <ChoiceCard selected={goal === 'pregnancy_support'} icon="🤰" title="I’m currently pregnant" description="A dedicated pregnancy space for milestones, wellbeing and your due-date journey." onClick={() => chooseGoal('pregnancy_support')} />
                        <ChoiceCard selected={goal === 'manage_symptoms'} icon="🪷" title="Managing symptoms & moods" description="Gentle daily check-ins and personal patterns." onClick={() => chooseGoal('manage_symptoms')} />
                        <label className="onboarding-toggle"><input type="checkbox" checked={wantsAstrology} onChange={event => { const enabled = event.target.checked; setWantsAstrology(enabled); if (!enabled && goal === 'cosmic_cycle') setGoal('track_cycle'); }} /><span className="onboarding-toggle__visual"></span><span><strong>Add a little astrology?</strong><small>Optional, even if you chose another goal.</small></span></label>
                    </div>}
                    {step === 1 && <div className="onboarding-fields">
                        <Field label="What should we call you?" hint="Your display name can be an aesthetic nickname.">
                            <input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={100} placeholder="Your name or chosen nickname" autoComplete="nickname" />
                        </Field>
                        <CalendarField label="When is your birthday?" value={birthDate} maxDate={localDateString(new Date())} onChange={setBirthDate} hint="Optional. Your birthday helps us celebrate your solar season." />
                        {wantsAstrology && <>
                            <div className="onboarding-optional-title">✧ A little more cosmic (all optional)</div>
                            <Field label="What time were you born?" hint="Skip this if you don't know your exact time.">
                                <div className={birthTimeUnknown ? "onboarding-clock-wrap is-disabled" : "onboarding-clock-wrap"}><BirthTimeField value={birthTime} onChange={setBirthTime} /></div>
                                <span className="onboarding-inline-check"><input type="checkbox" checked={birthTimeUnknown} onChange={event => setBirthTimeUnknown(event.target.checked)} /> I don't know my exact time</span>
                            </Field>
                            <Field label="Where were you born?" hint="City and country help with chart calculations later.">
                                <input value={birthPlace} onChange={event => setBirthPlace(event.target.value)} maxLength={160} placeholder="e.g. Nairobi, Kenya" />
                            </Field>
                        </>}
                    </div>}
                    {step === 2 && pregnancyJourney && <div className="onboarding-fields pregnancy-onboarding-fields">
                        <div className="pregnancy-onboarding-orbit"><span aria-hidden="true">✧</span><strong>YOUR LITTLE STAR’S ARRIVAL WINDOW</strong><small>Choose whichever date you know best. We’ll make an estimate, never a promise.</small></div>
                        <div className="pregnancy-date-source-grid">
                            {[{value:'due_date' as PregnancyDateSource,icon:'🌷',title:'I know my due date',detail:'My midwife or doctor gave me an estimate.'},{value:'last_period_date' as PregnancyDateSource,icon:'🌙',title:'I know my last period date',detail:'Use the first day to estimate a due date.'},{value:'conception_date' as PregnancyDateSource,icon:'✨',title:'I know the conception date',detail:'An estimate based on conception timing.'}].map(choice => <button type="button" key={choice.value} aria-pressed={pregnancyDateSource === choice.value} className={pregnancyDateSource === choice.value ? 'pregnancy-date-source is-selected' : 'pregnancy-date-source'} onClick={() => setPregnancyDateSource(choice.value)}><span aria-hidden="true">{choice.icon}</span><strong>{choice.title}</strong><small>{choice.detail}</small></button>)}
                        </div>
                        {pregnancyDateSource === 'due_date' && <CalendarField label="Your estimated due date" value={pregnancyDueDate} onChange={setPregnancyDueDate} hint="This is an estimate, and your care team may update it." />}
                        {pregnancyDateSource === 'last_period_date' && <CalendarField label="First day of your last period" value={pregnancyLastPeriodDate} maxDate={localDateString(new Date())} onChange={setPregnancyLastPeriodDate} hint="We use 280 days from this date as a conventional estimate." />}
                        {pregnancyDateSource === 'conception_date' && <CalendarField label="Estimated conception date" value={pregnancyConceptionDate} maxDate={localDateString(new Date())} onChange={setPregnancyConceptionDate} hint="We use 266 days from this date as a conventional estimate." />}
                        <label className="pregnancy-astrology-toggle"><input type="checkbox" checked={wantsBabyAstrology} onChange={event => setWantsBabyAstrology(event.target.checked)} /><span aria-hidden="true">✦</span><span><strong>Save a little Star Child sky keepsake?</strong><small>Optional astrology for fun. A due date cannot predict an exact birth chart or guarantee a zodiac sign.</small></span></label>
                        <p className="pregnancy-onboarding-safety">Pregnancy dates and week estimates can change. Crescent supports your personal journal; it does not replace prenatal care or medical advice.</p>
                    </div>}
                    {step === 2 && !pregnancyJourney && <div className="onboarding-fields">
                        <div className="onboarding-cycle-calendar"><div className="onboarding-cycle-calendar__intro"><span>✿ YOUR RECENT RHYTHM</span><p>Think of the last bleed you remember. We’ll place it on your personal moon calendar.</p></div><div className="onboarding-date-grid"><CalendarField label="The first day" hint="When did your period begin?" value={periodStart} maxDate={localDateString(new Date())} onChange={value => { setPeriodStart(value); if (periodEnd && value && periodEnd < value) setPeriodEnd(""); }} /><CalendarField label="The last day" hint="When did your bleeding finish?" value={periodEnd} maxDate={localDateString(new Date())} minDate={periodStart || undefined} onChange={setPeriodEnd} /></div><div className="onboarding-cycle-whisper"><span aria-hidden="true">☾</span><p>No pressure to remember perfectly. If you’re unsure, leave the dates blank and begin logging from today.</p></div></div>
                        <section className="onboarding-cycle-length"><div className="onboarding-cycle-length__top"><div><span>✧ YOUR CYCLE’S TEMPO</span><p>About how many days from one period’s first day to the next?</p></div><div className="onboarding-cycle-length__number"><strong>{cycleLengthUnknown ? '？' : cycleLength}</strong><small>{cycleLengthUnknown ? 'still a mystery' : 'days'}</small></div></div><input aria-label="Usual cycle length in days" type="range" min={21} max={45} step={1} value={cycleLength} disabled={cycleLengthUnknown} onChange={event => { setCycleLength(event.target.value); setCycleLengthUnknown(false); }} /><div className="onboarding-cycle-length__scale"><span>21 days</span><span>45 days</span></div><button type="button" className={cycleLengthUnknown ? 'onboarding-unknown-chip is-selected' : 'onboarding-unknown-chip'} aria-pressed={cycleLengthUnknown} onClick={() => setCycleLengthUnknown(current => !current)}><span aria-hidden="true">☁</span> I don’t know yet</button></section>
                        <fieldset className="onboarding-regularity"><legend>Does your cycle keep a steady rhythm?</legend><div className="onboarding-regularity__choices">{[{value:'regular' as Regularity,icon:'🌙',title:'Mostly steady',detail:'It tends to arrive around the same time.'},{value:'irregular' as Regularity,icon:'🌦️',title:'A little unpredictable',detail:'The timing often changes.'},{value:'unknown' as Regularity,icon:'🌱',title:'I’m still learning',detail:'I’m not sure yet.'}].map(choice => <button type="button" key={choice.value} aria-pressed={regularity === choice.value} className={regularity === choice.value ? 'onboarding-regularity-card is-selected' : 'onboarding-regularity-card'} onClick={() => setRegularity(choice.value)}><span aria-hidden="true">{choice.icon}</span><strong>{choice.title}</strong><small>{choice.detail}</small></button>)}</div></fieldset>
                        <fieldset className="onboarding-contraception"><legend>Are you using contraception?</legend><p>Choose the little card that feels right. This helps Crescent care for your cycle estimates thoughtfully.</p><div className="onboarding-contraception__grid">{CONTRACEPTION_CHOICES.map(choice => <button type="button" key={choice.value} aria-pressed={contraception === choice.value} className={`onboarding-contraception-card ${contraception === choice.value ? 'is-selected' : ''}`} onClick={() => setContraception(choice.value)}><span aria-hidden="true">{choice.icon}</span><strong>{choice.title}</strong><small>{choice.detail}</small><i aria-hidden="true">{contraception === choice.value ? '✦' : '○'}</i></button>)}</div></fieldset>
                        {['pill', 'patch', 'ring', 'implant', 'injection', 'hormonal_iud'].includes(contraception) && <p className="onboarding-safety-note">♡ Hormonal contraception can change or suppress ovulation. Crescent will focus on logging bleeding and daily wellbeing rather than assuming a natural ovulation pattern.</p>}
                    </div>}
                    {step === 3 && <div className="onboarding-choices">
                        <ChoiceCard selected={partnerPreference === 'solo'} icon="🪷" title="No, keeping it solo for now" description="Your Crescent space is just for you." onClick={() => setPartnerPreference('solo')} />
                        <ChoiceCard selected={partnerPreference === 'observer'} icon="💌" title="Invite a partner / observer" description="They can join as a companion, with sharing off by default." onClick={() => setPartnerPreference('observer')} />
                        <ChoiceCard selected={partnerPreference === 'co_tracker'} icon="🌷" title="Invite a co-cycling partner" description="Create a connection for two people who track cycles." onClick={() => setPartnerPreference('co_tracker')} />
                        {partnerPreference !== 'solo' && <p className="onboarding-connection-note">We’ll create a shareable Cosmic Sync Code that expires in seven days. You can decide what to share after your companion accepts.</p>}
                        <div className="onboarding-optional-title">Already have a Cosmic Sync Code?</div>
                        <Field label="Enter your companion’s code" hint="Paste an 8-character code to connect to an existing Crescent space."><input value={acceptCode} onChange={event => setAcceptCode(event.target.value.toUpperCase().slice(0, 8))} maxLength={8} placeholder="e.g. MOONSTAR" autoCapitalize="characters" /></Field>
                    </div>}
                    {error && <p className="onboarding-error" role="alert">{error}</p>}
                    <div className="onboarding-actions">
                        {step > 0 && <Button type="button" variant="outline" onClick={() => { setStep(currentStep => currentStep - 1); setError(''); }}>Back</Button>}
                        <Button type="submit" className="onboarding-next" disabled={isSaving}>{isSaving ? 'Saving your universe…' : step === activeSteps.length - 1 ? 'Create my Crescent space ✦' : 'Continue'}<span aria-hidden="true">→</span></Button>
                    </div>
                </form>
                <p className="onboarding-privacy">Your details stay private. You can update your choices later, and you can skip optional birth details.</p>
            </div>
        </section>
    </main>;
}
