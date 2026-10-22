import { useState, type FormEvent } from 'react';
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
    onboarding_completed?: boolean;
};

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function AuthPage({ mode }: AuthPageProps) {
    const isRegister = mode === 'register';
    const [name, setName] = useState('');
    const [relationshipRole, setRelationshipRole] = useState<'tracker' | 'support'>(() => new URLSearchParams(window.location.search).get('role') === 'support' ? 'support' : 'tracker');
    const inviteCode = new URLSearchParams(window.location.search).get('code')?.trim().toUpperCase() ?? '';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

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
                    ...(isRegister ? { name, password_confirmation: passwordConfirmation, relationship_role: relationshipRole } : {}),
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

            const codeQuery = inviteCode ? `?code=${encodeURIComponent(inviteCode)}` : '';
            if (isRegister && relationshipRole === 'support') window.location.assign(`/connections${codeQuery}`);
            else if (isRegister) window.location.assign(`/onboarding${codeQuery}`);
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
                        {isRegister && <fieldset className="auth-role-picker"><legend>How will you use Crescent?</legend><button type="button" className={relationshipRole === 'tracker' ? 'is-selected' : ''} aria-pressed={relationshipRole === 'tracker'} onClick={() => setRelationshipRole('tracker')}><span aria-hidden="true">🌙</span><span><strong>I’m tracking my own journey</strong><small>Cycle, fertility, pregnancy or postpartum.</small></span></button><button type="button" className={relationshipRole === 'support' ? 'is-selected' : ''} aria-pressed={relationshipRole === 'support'} onClick={() => setRelationshipRole('support')}><span aria-hidden="true">💌</span><span><strong>I’m here to support my partner</strong><small>A lighter setup, without reproductive tracking.</small></span></button></fieldset>}
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
