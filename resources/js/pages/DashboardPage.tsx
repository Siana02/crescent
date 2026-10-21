import { useEffect, useState, type FormEvent } from 'react';
import Button from '../components/Button';
import { getMoonPhase } from '../utils/moonPhase';

type DashboardData = {
    user: { name: string; email: string };
    profile: {
        average_cycle_length: number | null;
        average_period_length: number | null;
        cycle_regularity: 'regular' | 'irregular' | 'unknown';
        timezone: string;
    };
    latest_period: { start_date: string; end_date: string | null } | null;
    cycle_day: number | null;
    estimated_next_period: string | null;
    days_until_estimate: number | null;
};

type ApiError = { message?: string; errors?: Record<string, string[]> };

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function formatDate(date: string | null): string {
    if (!date) return 'Not logged yet';
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        .format(new Date(`${date}T12:00:00`));
}

function localDateInputValue(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function estimateCaption(days: number | null): string {
    if (days === null) return 'Add your cycle length and a period start date to see an estimate.';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} past this estimate`;
    if (days === 0) return 'Estimated for today';
    return `About ${days} day${days === 1 ? '' : 's'} from now`;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [lastPeriodStart, setLastPeriodStart] = useState('');
    const [lastPeriodEnd, setLastPeriodEnd] = useState('');
    const [averageCycleLength, setAverageCycleLength] = useState('');
    const [averagePeriodLength, setAveragePeriodLength] = useState('');
    const [cycleRegularity, setCycleRegularity] = useState<'regular' | 'irregular' | 'unknown'>('unknown');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const moon = getMoonPhase();

    async function loadDashboard() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const response = await fetch(`/api/dashboard?timezone=${encodeURIComponent(timezone)}`, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });
        if (response.status === 401) {
            window.location.assign('/login');
            return;
        }
        if (!response.ok) throw new Error('We could not load your dashboard. Please refresh and try again.');

        const result = (await response.json()) as DashboardData;
        setData(result);
        setLastPeriodStart(result.latest_period?.start_date ?? '');
        setLastPeriodEnd(result.latest_period?.end_date ?? '');
        setAverageCycleLength(result.profile.average_cycle_length == null ? '' : String(result.profile.average_cycle_length));
        setAveragePeriodLength(result.profile.average_period_length == null ? '' : String(result.profile.average_period_length));
        setCycleRegularity(result.profile.cycle_regularity ?? 'unknown');
    }

    useEffect(() => {
        loadDashboard()
            .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Something went wrong.'))
            .finally(() => setIsLoading(false));
    }, []);

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        setNotice('');

        if (lastPeriodEnd && !lastPeriodStart) {
            setError('Please add the period start date too, or leave both dates blank.');
            setIsSaving(false);
            return;
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        };

        try {
            const profileResponse = await fetch('/api/cycle-profile', {
                method: 'PUT',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({
                    average_cycle_length: averageCycleLength ? Number(averageCycleLength) : null,
                    average_period_length: averagePeriodLength ? Number(averagePeriodLength) : null,
                    cycle_regularity: cycleRegularity,
                    timezone,
                }),
            });
            const profileResult = (await profileResponse.json()) as ApiError;
            if (!profileResponse.ok) {
                const firstError = profileResult.errors ? Object.values(profileResult.errors)[0]?.[0] : undefined;
                throw new Error(firstError ?? profileResult.message ?? 'Could not save your cycle preferences.');
            }

            if (lastPeriodStart) {
                const periodResponse = await fetch('/api/periods', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers,
                    body: JSON.stringify({ start_date: lastPeriodStart, end_date: lastPeriodEnd || null }),
                });
                const periodResult = (await periodResponse.json()) as ApiError;
                if (!periodResponse.ok) {
                    const firstError = periodResult.errors ? Object.values(periodResult.errors)[0]?.[0] : undefined;
                    throw new Error(firstError ?? periodResult.message ?? 'Could not save your period dates.');
                }
            }

            await loadDashboard();
            setNotice('Your cycle details have been saved to your private account.');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'We could not save your details. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleLogout() {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
            });
        } finally {
            window.location.assign('/');
        }
    }

    if (isLoading) return <main className="dashboard-loading" aria-live="polite">Opening your space…</main>;

    const estimatedDate = data?.estimated_next_period ?? null;

    return (
        <div className="dashboard-shell">
            <header className="dashboard-header">
                <a className="dashboard-brand" href="/" aria-label="Crescent home"><span className="dashboard-brand__moon" aria-hidden="true">☾</span><span className="dashboard-brand__word">crescent<span>.</span></span></a>
                <div className="dashboard-header__actions">
                    <span className="dashboard-greeting">A little space for {data?.user.name.split(' ')[0] ?? 'you'}</span>
                    <Button variant="outline" className="dashboard-logout" onClick={handleLogout}>Sign out</Button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-intro">
                    <p className="dashboard-eyebrow">YOUR PERSONAL CYCLE SPACE</p>
                    <h1>Hello, {data?.user.name.split(' ')[0] ?? 'there'}<em>Let’s check in.</em></h1>
                    <p>Your cycle is personal. Share what you know, choose “I don’t know” where you’re unsure, and update your details whenever you need.</p>
                </div>

                {error && <p className="dashboard-alert" role="alert">{error}</p>}
                {notice && <p className="dashboard-notice" role="status">{notice}</p>}

                <section className="dashboard-cards" aria-label="Cycle overview">
                    <article className="dashboard-card dashboard-card--cycle">
                        <div className="dashboard-card__eyebrow"><span aria-hidden="true">◔</span> CYCLE OVERVIEW</div>
                        <p className="dashboard-card__metric">{data?.cycle_day ? `Day ${data.cycle_day}` : 'Your rhythm'}</p>
                        <p className="dashboard-card__description">
                            {data?.latest_period
                                ? `Your latest logged period started ${formatDate(data.latest_period.start_date)}.`
                                : 'Add your last period dates below to begin your personal overview.'}
                        </p>
                        <div className="dashboard-card__footnote">{data?.latest_period ? 'Based on the start date you logged' : 'No cycle data has been added yet'}</div>
                    </article>

                    <article className="dashboard-card dashboard-card--estimate">
                        <div className="dashboard-card__eyebrow"><span aria-hidden="true">✧</span> NEXT PERIOD ESTIMATE</div>
                        <p className="dashboard-card__metric dashboard-card__metric--date">{formatDate(estimatedDate)}</p>
                        <p className="dashboard-card__description">{estimateCaption(data?.days_until_estimate ?? null)}</p>
                        <div className="dashboard-card__footnote">An estimate based on your average cycle length, not a guarantee.</div>
                    </article>

                    <article className="dashboard-card dashboard-card--moon">
                        <div className="dashboard-card__eyebrow"><span aria-hidden="true">☾</span> TODAY’S MOON</div>
                        <div className="moon-phase-display">
                            <span className="moon-phase-display__symbol" aria-hidden="true">{moon.symbol}</span>
                            <div><p className="moon-phase-display__name">{moon.name}</p><p className="moon-phase-display__caption">Approximately {moon.illumination}% illuminated</p></div>
                        </div>
                        <p className="dashboard-card__description">A small lunar note to enjoy alongside your own observations.</p>
                        <div className="dashboard-card__footnote">Moon phases and menstrual cycles are shown separately.</div>
                    </article>
                </section>

                <section className="cycle-settings" aria-labelledby="cycle-settings-title">
                    <div className="cycle-settings__intro">
                        <p className="dashboard-eyebrow">START WHERE YOU ARE</p>
                        <h2 id="cycle-settings-title">Let’s get to know your cycle</h2>
                        <p>Tell us what you remember about your most recent period and your usual pattern. If you’re unsure, “I don’t know” is a perfectly good answer.</p>
                    </div>
                    <form className="cycle-settings__form" onSubmit={handleSave}>
                        <div className="cycle-settings__number-fields">
                            <label>
                                When did your last period start?
                                <input type="date" value={lastPeriodStart} max={localDateInputValue()} onChange={(event) => setLastPeriodStart(event.target.value)} />
                                <span className="field-hint">Leave blank if you don’t remember.</span>
                            </label>
                            <label>
                                When did it end?
                                <input type="date" value={lastPeriodEnd} min={lastPeriodStart || undefined} max={localDateInputValue()} onChange={(event) => setLastPeriodEnd(event.target.value)} />
                                <span className="field-hint">Leave blank if it hasn’t ended or you don’t remember.</span>
                            </label>
                        </div>

                        <label>
                            Is your cycle usually…
                            <select value={cycleRegularity} onChange={(event) => setCycleRegularity(event.target.value as 'regular' | 'irregular' | 'unknown')}>
                                <option value="regular">Regular</option>
                                <option value="irregular">Irregular</option>
                                <option value="unknown">I don’t know</option>
                            </select>
                        </label>

                        <div className="cycle-settings__number-fields">
                            <label>
                                How many days is your usual cycle?
                                <span className="number-input-wrap"><input type="number" min={21} max={45} value={averageCycleLength} onChange={(event) => setAverageCycleLength(event.target.value)} placeholder="I don’t know" /><span>days</span></span>
                                <span className="field-hint">Count from the first day of one period to the first day of the next. Leave blank if unsure.</span>
                            </label>
                            <label>
                                How many days does your period usually last?
                                <span className="number-input-wrap"><input type="number" min={1} max={10} value={averagePeriodLength} onChange={(event) => setAveragePeriodLength(event.target.value)} placeholder="I don’t know" /><span>days</span></span>
                                <span className="field-hint">Leave blank if you’re not sure yet.</span>
                            </label>
                        </div>

                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving your details…' : 'Save cycle details'}
                            <span className="button__icon" aria-hidden="true">→</span>
                        </Button>
                        <p className="cycle-settings__privacy">Only your signed-in account can access these cycle details. You can change them later.</p>
                    </form>
                </section>

                <p className="dashboard-disclaimer">Crescent offers personal tracking and estimates, not medical advice or contraception guidance. Cycle patterns vary, and an estimate cannot predict exactly when a period will start.</p>
            </main>
            <footer className="dashboard-footer"><a href="/">☾ crescent.</a><span>Made with care, for every cycle.</span></footer>
        </div>
    );
}
