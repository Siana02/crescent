import { useState, type FormEvent, type ReactNode } from 'react';
import Button from '../components/Button';
import '../styles/onboarding.css';

type Goal = 'track_cycle' | 'cosmic_cycle' | 'fertility_support' | 'manage_symptoms';
type PartnerPreference = 'solo' | 'observer' | 'co_tracker';
type Regularity = 'regular' | 'irregular' | 'unknown';

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

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const [goal, setGoal] = useState<Goal>('track_cycle');
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

    function chooseGoal(next: Goal) {
        setGoal(next);
        if (next === 'cosmic_cycle') setWantsAstrology(true);
    }

    async function saveOnboarding(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (step < STEPS.length - 1) { setStep(current => current + 1); setError(''); return; }
        setError('');
        if (periodEnd && !periodStart) { setError('Add your period start date too, or leave both dates blank.'); return; }
        if (periodStart && periodEnd && periodEnd < periodStart) { setError('Your period end date cannot be before its start date.'); return; }

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
                    wants_astrology: wantsAstrology,
                    birth_date: birthDate || null,
                    birth_time: wantsAstrology && !birthTimeUnknown && birthTime ? birthTime : null,
                    birth_place: wantsAstrology ? birthPlace.trim() || null : null,
                    average_cycle_length: cycleLengthUnknown ? null : Number(cycleLength),
                    average_period_length: periodStart && periodEnd ? Math.round((new Date(`${periodEnd}T12:00:00`).getTime() - new Date(`${periodStart}T12:00:00`).getTime()) / 86400000) + 1 : null,
                    cycle_regularity: regularity,
                    contraception_type: contraception,
                    partner_preference,
                    timezone,
                    onboarding_completed: true,
                }),
            });
            const profileResult = (await profileResponse.json()) as ApiError;
            if (!profileResponse.ok) throw new Error(firstError(profileResult, 'We could not save your details just yet.'));
            if (periodStart) {
                const periodResponse = await fetch('/api/periods', {
                    method: 'POST', credentials: 'same-origin', headers,
                    body: JSON.stringify({ start_date: periodStart, end_date: periodEnd || null }),
                });
                const periodResult = (await periodResponse.json()) as ApiError;
                if (!periodResponse.ok) throw new Error(firstError(periodResult, 'Your period dates could not be saved.'));
            }
            if (partnerPreference !== 'solo') {
                const inviteResponse = await fetch('/api/relationships/invite', {
                    method: 'POST', credentials: 'same-origin', headers,
                    body: JSON.stringify({ relationship_type: partnerPreference }),
                });
                const inviteResult = (await inviteResponse.json()) as InviteResponse;
                if (!inviteResponse.ok) throw new Error(firstError(inviteResult, 'Your Cosmic Sync Code could not be created.'));
                setInviteCode(inviteResult.invite_code ?? '');
            }
            window.setTimeout(() => window.location.assign('/dashboard'), 1800);
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
            {inviteCode && <div className="onboarding-invite"><span>Your Cosmic Sync Code</span><strong>{inviteCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copy code</button><small>Share this with your companion. Your cycle details stay private until you choose to share them.</small></div>}
        </main>;
    }

    const current = STEPS[step];
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
                <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
                    {STEPS.map((item, index) => <span key={item.eyebrow} className={index <= step ? 'is-complete' : ''}></span>)}
                </div>
                <p className="onboarding-eyebrow">{current.eyebrow} · STEP {step + 1} OF {STEPS.length}</p>
                <h1 id="onboarding-title">{current.title}</h1>
                <p className="onboarding-subtitle">{current.subtitle}</p>
                <form onSubmit={saveOnboarding} className="onboarding-form">
                    {step === 0 && <div className="onboarding-choices">
                        <ChoiceCard selected={goal === 'track_cycle'} icon="🌿" title="Just tracking my body & cycle" description="Period dates, symptoms, moods and patterns." onClick={() => chooseGoal('track_cycle')} />
                        <ChoiceCard selected={goal === 'cosmic_cycle'} icon="🌙" title="Syncing my cycle with the cosmos" description="Cycle tracking with astrology and lunar notes." onClick={() => chooseGoal('cosmic_cycle')} />
                        <ChoiceCard selected={goal === 'fertility_support'} icon="🌸" title="Planning a pregnancy / fertility" description="Cycle awareness and estimated fertile windows." onClick={() => chooseGoal('fertility_support')} />
                        <ChoiceCard selected={goal === 'manage_symptoms'} icon="🪷" title="Managing symptoms & moods" description="Gentle daily check-ins and personal patterns." onClick={() => chooseGoal('manage_symptoms')} />
                        <label className="onboarding-toggle"><input type="checkbox" checked={wantsAstrology} onChange={event => setWantsAstrology(event.target.checked)} /><span className="onboarding-toggle__visual"></span><span><strong>Add a little astrology?</strong><small>Optional, even if you chose another goal.</small></span></label>
                    </div>}
                    {step === 1 && <div className="onboarding-fields">
                        <Field label="What should we call you?" hint="Your display name can be an aesthetic nickname.">
                            <input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={100} placeholder="Your name or chosen nickname" autoComplete="nickname" />
                        </Field>
                        <Field label="When is your birthday?" hint="Optional. We only use it for personalisation you choose.">
                            <input type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={event => setBirthDate(event.target.value)} />
                        </Field>
                        {wantsAstrology && <>
                            <div className="onboarding-optional-title">✧ A little more cosmic (all optional)</div>
                            <Field label="What time were you born?" hint="Skip this if you don't know your exact time.">
                                <input type="time" value={birthTime} disabled={birthTimeUnknown} onChange={event => setBirthTime(event.target.value)} />
                                <label className="onboarding-inline-check"><input type="checkbox" checked={birthTimeUnknown} onChange={event => setBirthTimeUnknown(event.target.checked)} /> I don't know my exact time</label>
                            </Field>
                            <Field label="Where were you born?" hint="City and country help with chart calculations later.">
                                <input value={birthPlace} onChange={event => setBirthPlace(event.target.value)} maxLength={160} placeholder="e.g. Nairobi, Kenya" />
                            </Field>
                        </>}
                    </div>}
                    {step === 2 && <div className="onboarding-fields">
                        <div className="onboarding-date-grid">
                            <Field label="When did your last period start?"><input type="date" value={periodStart} max={new Date().toISOString().slice(0, 10)} onChange={event => setPeriodStart(event.target.value)} /></Field>
                            <Field label="When did it end?"><input type="date" value={periodEnd} max={new Date().toISOString().slice(0, 10)} min={periodStart || undefined} onChange={event => setPeriodEnd(event.target.value)} /></Field>
                        </div>
                        <Field label="How long is your usual cycle?">
                            <select value={cycleLengthUnknown ? 'unknown' : cycleLength} onChange={event => { setCycleLengthUnknown(event.target.value === 'unknown'); if (event.target.value !== 'unknown') setCycleLength(event.target.value); }}>
                                <option value="unknown">🤷‍♀️ I have no idea</option>
                                {Array.from({ length: 25 }, (_, index) => index + 21).map(days => <option key={days} value={days}>{days} days</option>)}
                            </select>
                        </Field>
                        <fieldset className="onboarding-radio-field"><legend>Is your cycle regular?</legend>
                            {[['regular', 'Yes, mostly'], ['irregular', 'No, it varies'], ['unknown', "I'm not sure"]].map(([value, label]) => <label key={value}><input type="radio" name="regularity" value={value} checked={regularity === value} onChange={() => setRegularity(value as Regularity)} /><span>{label}</span></label>)}
                        </fieldset>
                        <Field label="Are you using contraception?" hint="This helps us avoid misleading ovulation estimates.">
                            <select value={contraception} onChange={event => setContraception(event.target.value)}>
                                <option value="none">None — natural tracking</option>
                                <option value="pill">Hormonal pill</option>
                                <option value="patch">Hormonal patch</option>
                                <option value="ring">Hormonal ring</option>
                                <option value="implant">Hormonal implant</option>
                                <option value="injection">Hormonal injection</option>
                                <option value="hormonal_iud">Hormonal IUD</option>
                                <option value="copper_iud">Copper IUD</option>
                                <option value="other">Other / barrier method</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </Field>
                        {['pill', 'patch', 'ring', 'implant', 'injection', 'hormonal_iud'].includes(contraception) && <p className="onboarding-safety-note">♡ Hormonal contraception can change or suppress ovulation. Crescent will focus on logging bleeding and daily wellbeing rather than assuming a natural ovulation pattern.</p>}
                    </div>}
                    {step === 3 && <div className="onboarding-choices">
                        <ChoiceCard selected={partnerPreference === 'solo'} icon="🪷" title="No, keeping it solo for now" description="Your Crescent space is just for you." onClick={() => setPartnerPreference('solo')} />
                        <ChoiceCard selected={partnerPreference === 'observer'} icon="💌" title="Invite a partner / observer" description="They can join as a companion, with sharing off by default." onClick={() => setPartnerPreference('observer')} />
                        <ChoiceCard selected={partnerPreference === 'co_tracker'} icon="🌷" title="Invite a co-cycling partner" description="Create a connection for two people who track cycles." onClick={() => setPartnerPreference('co_tracker')} />
                        {partnerPreference !== 'solo' && <p className="onboarding-connection-note">We’ll create a one-time shareable Cosmic Sync Code. You can decide what to share after your companion accepts.</p>}
                    </div>}
                    {error && <p className="onboarding-error" role="alert">{error}</p>}
                    <div className="onboarding-actions">
                        {step > 0 && <Button type="button" variant="outline" onClick={() => { setStep(currentStep => currentStep - 1); setError(''); }}>Back</Button>}
                        <Button type="submit" className="onboarding-next" disabled={isSaving}>{isSaving ? 'Saving your universe…' : step === STEPS.length - 1 ? 'Create my Crescent space ✦' : 'Continue'}<span aria-hidden="true">→</span></Button>
                    </div>
                </form>
                <p className="onboarding-privacy">Your details stay private. You can update your choices later, and you can skip optional birth details.</p>
            </div>
        </section>
    </main>;
}
