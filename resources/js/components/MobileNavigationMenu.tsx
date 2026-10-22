import { useState } from 'react';
import { Home, LogOut, Settings, Sparkles, Users } from 'lucide-react';

type Props = { onLogout?: () => void | Promise<void> };

const links = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/connections', label: 'Connections', icon: Users },
  { href: '/profile', label: 'Profile & settings', icon: Settings },
  { href: '/astrology', label: 'The Cosmic Atelier', icon: Sparkles },
];

function csrf() {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function MobileNavigationMenu({ onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError('');
    try {
      if (onLogout) {
        await onLogout();
        return;
      }
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
      });
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      window.location.assign('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign out. Please try again.');
      setSigningOut(false);
    }
  }

  return <div className="cosmic-mobile-nav">
    <button className={`cosmic-mobile-nav__toggle${open ? ' is-open' : ''}`} type="button" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="cosmic-mobile-menu" onClick={() => { setOpen(value => !value); setError(''); }}>
      <span className="cosmic-menu-glyph" aria-hidden="true"><i /><i /><i /></span>
    </button>
    {open && <>
      <button type="button" className="cosmic-mobile-nav__scrim" aria-label="Close navigation menu" onClick={() => setOpen(false)} />
      <nav id="cosmic-mobile-menu" className="cosmic-mobile-nav__panel" aria-label="Mobile navigation">
        <div className="cosmic-mobile-nav__heading"><span className="cosmic-brand__mark">☾</span><div><strong>Your Crescent</strong><small>Where would you like to go?</small></div></div>
        {links.map(({ href, label, icon: Icon }) => <a key={href} href={href} className={window.location.pathname.replace(/\/$/, '') === href ? 'is-active' : ''}><Icon size={18} aria-hidden="true" /><span>{label}</span><span className="cosmic-mobile-nav__arrow" aria-hidden="true">↗</span></a>)}
        <div className="cosmic-mobile-nav__divider" />
        <button type="button" className="cosmic-mobile-nav__signout" onClick={() => void signOut()} disabled={signingOut}><LogOut size={18} aria-hidden="true" /><span>{signingOut ? 'Signing out…' : 'Sign out'}</span></button>
        {error && <p className="cosmic-mobile-nav__error" role="alert">{error}</p>}
        <p className="cosmic-mobile-nav__footnote">Your body, your story, your space. ✧</p>
      </nav>
    </>}
  </div>;
}
