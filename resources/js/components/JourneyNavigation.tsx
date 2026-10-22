import '../styles/pregnancy.css';

type Props = { active?: 'dashboard' | 'connections' | 'atelier' | 'profile'; journey?: 'pregnancy' | 'postpartum' | 'co-cycling'; babyAtelier?: boolean };

const LINKS = [
    { href: '/dashboard', label: 'My journey', key: 'dashboard' },
    { href: '/connections', label: 'Connections', key: 'connections' },
    { href: '/astrology', label: 'Cosmic Atelier', key: 'atelier' },
    { href: '/profile', label: 'Profile & settings', key: 'profile' },
] as const;

export default function JourneyNavigation({ active = 'dashboard', journey = 'pregnancy', babyAtelier = false }: Props) {
    return <nav className="pregnancy-journey-nav" aria-label="Your Crescent spaces">
        <span className="pregnancy-journey-nav__label">{journey === 'postpartum' ? 'POSTPARTUM & NEWBORN' : journey === 'co-cycling' ? 'CO-CYCLING JOURNEY' : 'PREGNANCY JOURNEY'}</span>
        <div>{LINKS.map(link => <a key={link.key} href={babyAtelier && link.key === 'atelier' ? '/astrology?subject=baby' : link.href} aria-current={active === link.key ? 'page' : undefined} className={active === link.key ? 'is-active' : ''}>{link.label}</a>)}</div>
    </nav>;
}
