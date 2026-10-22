import { useEffect, useState, type FormEvent } from 'react';
import Button from '../components/Button';
import '../styles/auth-cosmic.css';

type AuthMode = 'login' | 'register';

type AuthPageProps = {
    mode: AuthMode;
};

type AuthResponse = {
    message?: string;
    errors?: Record<string, string[]>;
    relationship_role?: 'tracker' | 'support';
    registration_intent?: 'tracker' | 'support' | 'co_tracker';
    onboarding_completed?: boolean;
    astrology_enabled?: boolean;
};

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function AuthPage({ mode }: AuthPageProps) {
    const isRegister = mode === 'register';
    const [name, setName] = useState('');
    const [relationshipRole, setRelationshipRole] = useState<'tracker' | 'support' | 'co_tracker'>(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('role') === 'support') return 'support';
        if (params.get('role') === 'co_tracker') return 'co_tracker';
        return 'tracker';
    });
    const [inviteCode, setInviteCode] = useState(() => new URLSearchParams(window.location.search).get('code')?.trim().toUpperCase().slice(0, 8) ?? '');
    const [invitePreview, setInvitePreview] = useState<{ relationship_type: 'observer' | 'co_tracker'; astrology_enabled: boolean; requires_birth_date: boolean } | null>(null);
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [checkingInvite, setCheckingInvite] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function checkInvitation() {
        if (inviteCode.trim().length !== 8) { setError('Enter the full 8-character Cosmic Sync Code first.'); return; }
        setCheckingInvite(true); setError(''); setInvitePreview(null);
        try {
            const response = await fetch('/auth/invitation-preview?code=' + encodeURIComponent(inviteCode.trim().toUpperCase()), { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            const data = await response.json() as { relationship_type?: 'observer' | 'co_tracker'; astrology_enabled?: boolean; requires_birth_date?: boolean; message?: string; errors?: Record<string, string[]> };
            if (!response.ok || !data.relationship_type) throw new Error(data.errors ? Object.values(data.errors)[0]?.[0] : data.message ?? 'That invitation could not be checked.');
            setInvitePreview({ relationship_type: data.relationship_type, astrology_enabled: Boolean(data.astrology_enabled), requires_birth_date: Boolean(data.requires_birth_date) });
            setRelationshipRole(data.relationship_type === 'co_tracker' ? 'co_tracker' : 'support');
            setError('');
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'That invitation could not be checked.');
        } finally { setCheckingInvite(false); }
    }

    useEffect(() => {
        if (isRegister && inviteCode.length === 8) void checkInvitation();
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (isRegister && ['support', 'co_tracker'].includes(relationshipRole) && inviteCode.trim().length !== 8) {
            setError('Enter your partner’s 8-character Cosmic Sync Code.'); setIsSubmitting(false); return;
        }
        if (isRegister && relationshipRole !== 'tracker' && !invitePreview) {
            setError('Check your Cosmic Sync Code before creating your account.'); setIsSubmitting(false); return;
        }
        if (isRegister && relationshipRole !== 'tracker' && invitePreview?.astrology_enabled && !birthDate) {
            setError('Your partner has enabled astrology. Please add your birth date.'); setIsSubmitting(false); return;
        }

        try {
            const response = await fetch(`/auth/${mode}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    ...(isRegister ? {
                        name,
                        password_confirmation: passwordConfirmation,
                        relationship_role: relationshipRole === 'support' ? 'support' : 'tracker',
                        registration_intent: relationshipRole,
                        ...(inviteCode ? { invite_code: inviteCode.trim().toUpperCase() } : {}),
                        ...(relationshipRole !== 'tracker' && invitePreview?.astrology_enabled ? {
                            birth_date: birthDate || null,
                            birth_time: birthTime || null,
                            birth_place: birthPlace.trim() || null,
                        } : {}),
                    } : {}),
                    email,
                    password,
                }),
            });
            const data = (await response.json()) as AuthResponse;

            if (!response.ok) {
                const firstValidationError = data.errors ? Object.values(data.errors)[0]?.[0] : undefined;
                setError(firstValidationError ?? data.message ?? 'We could not complete that request. Please try again.');
                return;
            }

            const codeQuery = inviteCode ? `?code=${encodeURIComponent(inviteCode.trim().toUpperCase())}` : '';
            if (isRegister && relationshipRole === 'support') window.location.assign('/dashboard');
            else if (isRegister && relationshipRole === 'co_tracker') window.location.assign(`/onboarding${codeQuery}`);
            else if (isRegister) window.location.assign('/onboarding');
            else if (inviteCode && data.relationship_role !== 'support' && !data.onboarding_completed) window.location.assign(`/onboarding${codeQuery}`);
            else if (inviteCode) window.location.assign(`/connections${codeQuery}`);
            else window.location.assign('/dashboard');
        } catch {
            setError('We could not reach Crescent. Check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="auth-shell">
            <a className="auth-back-link" href="/">← Back to Crescent</a>
            <section className="auth-card" aria-labelledby="auth-title">
                <div className="auth-card__art" aria-hidden="true">
                    <span className="auth-card__moon">☾</span>
                    <span className="auth-card__spark auth-card__spark--one">✦</span>
                    <span className="auth-card__spark auth-card__spark--two">✧</span>
                    <p>A softer space to understand your own rhythm, under a sky full of possibility.</p>
                </div>
                <div className="auth-card__form">
                    <a className="auth-brand" href="/">☾ <span>crescent.</span></a>
                    <p className="auth-eyebrow">{isRegister ? 'YOUR SPACE, YOUR PACE' : 'WELCOME BACK'}</p>
                    <h1 id="auth-title">{isRegister ? 'Begin with you.' : 'Good to see you.'}</h1>
                    <p className="auth-description">
                        {isRegister
                            ? 'Create your private little universe. We’ll personalise it together in just a few steps.'
                            : 'Come back to your own little corner of the cosmos.'}
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {isRegister && <fieldset className="auth-role-picker"><legend>How will you use Crescent?</legend>
                            <button type="button" className={relationshipRole === 'tracker' ? 'is-selected' : ''} aria-pressed={relationshipRole === 'tracker'} onClick={() => { setRelationshipRole('tracker'); setError(''); }}><span aria-hidden="true">🌙</span><span><strong>I’m tracking my own journey</strong><small>Cycle, fertility, pregnancy or postpartum — just for me.</small></span></button>
                            <button type="button" className={relationshipRole === 'support' ? 'is-selected' : ''} aria-pressed={relationshipRole === 'support'} onClick={() => { setRelationshipRole('support'); setInvitePreview(null); setError(''); }}><span aria-hidden="true">💌</span><span><strong>I’m here to support my partner</strong><small>Join their space and see only what they choose to share.</small></span></button>
                            <button type="button" className={relationshipRole === 'co_tracker' ? 'is-selected' : ''} aria-pressed={relationshipRole === 'co_tracker'} onClick={() => { setRelationshipRole('co_tracker'); setInvitePreview(null); setError(''); }}><span aria-hidden="true">🌷</span><span><strong>I’m joining a co-cycling connection</strong><small>Keep your own journey and build a shared space together.</small></span></button>
                        </fieldset>}
                        {isRegister && <div className="auth-invite-setup">
                            <label htmlFor="auth-invite-code">Cosmic Sync Code {relationshipRole === 'tracker' ? <small>(optional unless you’re joining someone)</small> : <small>(required)</small>}</label>
                            <div className="auth-invite-code-row"><input id="auth-invite-code" value={inviteCode} onChange={event => { setInviteCode(event.target.value.toUpperCase().slice(0, 8)); setInvitePreview(null); }} maxLength={8} placeholder="e.g. MOONSTAR" autoCapitalize="characters" /><Button type="button" variant="outline" disabled={checkingInvite || inviteCode.trim().length !== 8} onClick={() => void checkInvitation()}>{checkingInvite ? 'Checking…' : 'Check code'}</Button></div>
                            {invitePreview && <p className="auth-invite-confirmation" role="status">{invitePreview.relationship_type === 'co_tracker' ? 'Co-cycling invitation found.' : 'Support invitation found.'} {invitePreview.astrology_enabled ? 'Astrology is enabled, so we’ll set up your birth details too.' : 'Birth details can be added later in Profile & settings.'}</p>}
                            {relationshipRole !== 'tracker' && invitePreview?.astrology_enabled && <fieldset className="auth-birth-fields"><legend>Your birth details for shared astrology</legend>
                                <label>Birth date<input type="date" value={birthDate} onChange={event => setBirthDate(event.target.value)} required max={new Date().toISOString().slice(0, 10)} /></label>
                                <label>Birth time <small>Optional, but helpful for rising sign and houses.</small><input type="time" value={birthTime} onChange={event => setBirthTime(event.target.value)} /></label>
                                <label>Birth place <small>Optional, but improves location-sensitive chart calculations.</small><input value={birthPlace} onChange={event => setBirthPlace(event.target.value)} maxLength={160} placeholder="City, country" /></label>
                            </fieldset>}
                        </div>
                        {isRegister && (
                            <label>
                                Your name
                                <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
                            </label>
                        )}
                        <label>
                            Email address
                            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={255} />
                        </label>
                        <label>
                            Password
                            <input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
                        </label>
                        {isRegister && (
                            <label>
                                Confirm password
                                <input type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required minLength={8} />
                            </label>
                        )}
                        {error && <p className="auth-error" role="alert">{error}</p>}
                        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'One moment…' : isRegister ? 'Create your account' : 'Sign in'}
                            <span className="button__icon" aria-hidden="true">→</span>
                        </Button>
                    </form>
                    <p className="auth-switch">
                        {isRegister ? 'Already have a space here?' : 'New to Crescent?'}{' '}
                        <a href={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</a>
                    </p>
                    <p className="auth-privacy">Your cycle details belong to you. Keep your password private, and sign out on shared devices.</p>
                </div>
            </section>
        </main>
    );
}
