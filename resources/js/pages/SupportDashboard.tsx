import '../styles/cosmic-dashboard.css';
import SharedPartnerSpace from '../components/SharedPartnerSpace';

type SharingKey = 'cycle_details' | 'pregnancy_details' | 'wellbeing_updates' | 'astrology';
type SharingPreferences = Record<SharingKey, boolean>;
type SharedRelationship = {
    id: number;
    relationship_type: 'observer' | 'co_tracker';
    status: 'pending' | 'accepted' | 'revoked';
    companion_name: string | null;
    companion_journey: 'cycle' | 'fertility' | 'pregnancy' | 'postpartum' | null;
    companion_cycle_summary: { last_period_start: string; cycle_day: number; estimated_next_period: string | null } | null;
    companion_pregnancy_summary: { status: string; due_date: string; gestational_week: number | null; trimester: number | null; days_until_due: number | null } | null;
    companion_wellbeing: { log_date: string; mood?: string[]; symptoms?: string[]; energy_level?: number | null; category?: string; notes?: string | null } | null;
    companion_sun_sign: string | null;
    companion_moon_sign: string | null;
    companion_rising_sign: string | null;
    sharing_preferences: SharingPreferences;
    companion_sharing_preferences: SharingPreferences;
};
type SupportDashboardData = {
    user: { name: string; email: string };
    profile: { relationship_role: 'tracker' | 'support'; birth_date: string | null; sun_sign: string | null; moon_sign: string | null; rising_sign: string | null };
    relationships?: SharedRelationship[];
};
const labels: { key: SharingKey; title: string; icon: string }[] = [
    { key: 'cycle_details', title: 'Cycle updates', icon: 'water_drop' },
    { key: 'pregnancy_details', title: 'Pregnancy updates', icon: 'child_care' },
    { key: 'wellbeing_updates', title: 'Wellbeing check-ins', icon: 'favorite' },
    { key: 'astrology', title: 'Astrology', icon: 'auto_awesome' },
];
function dateLabel(value: string) {
    return new Date(value + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}
function csrfToken() { return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''; }

export default function SupportDashboard({ data, onLogout }: { data: SupportDashboardData; onLogout: () => void }) {
    const connection = (data.relationships ?? []).find(item => item.status === 'accepted' && item.relationship_type === 'observer');
    const permissions = connection?.companion_sharing_preferences ?? connection?.sharing_preferences;
    return <div className="cosmic-dashboard cosmic-support-dashboard">
        <header className="cosmic-header">
            <a className="cosmic-brand" href="/dashboard"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a>
            <nav><a className="is-active" href="/dashboard">Home</a><a href="/connections">Connections</a><a href="/astrology">The Cosmic Atelier</a><a href="/profile">Profile & settings</a></nav>
            <div className="cosmic-header__right"><button type="button" onClick={onLogout}>Sign out ↗</button></div>
        </header>
        <main className="cosmic-main">
            <section className="cosmic-welcome cosmic-connections-welcome">
                <div><p className="cosmic-eyebrow">A LITTLE SPACE TO SHOW UP</p><h1>Here for them, <em>with care.</em></h1>
                    <p>{connection ? `Your shared Crescent space with ${connection.companion_name ?? 'your partner'} is ready. Here are the updates they chose to share with you.` : 'Your support space will appear here once you connect with your partner.'}</p>
                    <div className="cosmic-connection-promise"><span>✧</span> Their choices · Your own profile · Gentle connection</div>
                </div><div className="cosmic-welcome__art"><span>💌</span><i>✦</i></div>
            </section>
            {connection && <SharedPartnerSpace />}
            {!connection ? <section className="cosmic-week-card cosmic-support-empty"><p className="cosmic-eyebrow">YOUR SHARED SPACE</p><h2>No connected space yet</h2><p>Ask your partner for their Cosmic Sync Code. You can connect from the Connections page.</p><a className="cosmic-support-link" href="/connections">Open Connections →</a></section> : <>
                <section className="cosmic-week-card cosmic-support-permissions">
                    <div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">YOUR PARTNER'S CHOICES</p><h2>What they share with you</h2></div><span className="cosmic-guide-stamp" aria-hidden="true">♡</span></div>
                    <p className="cosmic-muted">These settings were chosen by your partner before they created the invitation. You can view them here; only they can change what is shared.</p>
                    <div className="cosmic-support-permission-list">{labels.map(item => <article key={item.key} className={permissions?.[item.key] ? 'is-enabled' : ''}><span className="material-symbols-rounded">{item.icon}</span><div><strong>{item.title}</strong><small>{permissions?.[item.key] ? 'Your partner has enabled this update.' : 'Your partner has kept this private.'}</small></div><b>{permissions?.[item.key] ? 'Shared' : 'Private'}</b></article>)}</div>
                </section>
                {connection.companion_cycle_summary && permissions?.cycle_details && <section className="cosmic-week-card cosmic-support-shared-card">
                    <p className="cosmic-eyebrow">CYCLE JOURNEY · SHARED WITH YOU</p><div className="cosmic-support-cycle"><span className="material-symbols-rounded">water_drop</span><div><h2>Cycle day {connection.companion_cycle_summary.cycle_day}</h2><p>Last period began {dateLabel(connection.companion_cycle_summary.last_period_start)}.</p>{connection.companion_cycle_summary.estimated_next_period && <p>Estimated next period · {dateLabel(connection.companion_cycle_summary.estimated_next_period)}</p>}</div></div>
                    <p className="cosmic-fineprint">Cycle dates and estimates are approximate, and can change as more information is logged.</p>
                </section>}
                {connection.companion_pregnancy_summary && permissions?.pregnancy_details && <section className="cosmic-week-card cosmic-support-shared-card">
                    <p className="cosmic-eyebrow">PREGNANCY JOURNEY · SHARED WITH YOU</p><div className="cosmic-support-cycle"><span className="material-symbols-rounded">child_care</span><div><h2>{connection.companion_pregnancy_summary.status === 'postpartum' ? 'Postpartum journey' : `Week ${connection.companion_pregnancy_summary.gestational_week ?? '—'} · Trimester ${connection.companion_pregnancy_summary.trimester ?? '—'}`}</h2><p>{connection.companion_pregnancy_summary.status === 'active' ? `Estimated due date · ${dateLabel(connection.companion_pregnancy_summary.due_date)}` : 'A postpartum update from your partner.'}</p>{connection.companion_pregnancy_summary.status === 'active' && connection.companion_pregnancy_summary.days_until_due !== null && <p>{connection.companion_pregnancy_summary.days_until_due} days to estimated due date</p>}</div></div>
                    <p className="cosmic-fineprint">Pregnancy timing is an estimate and does not replace advice from their care team.</p>
                </section>}
                {connection.companion_wellbeing && permissions?.wellbeing_updates && <section className="cosmic-week-card cosmic-support-shared-card">
                    <p className="cosmic-eyebrow">A LITTLE WELLBEING CHECK-IN</p><h2>How they're feeling</h2><p className="cosmic-muted">Latest update · {dateLabel(connection.companion_wellbeing.log_date)}</p>
                    <div className="cosmic-support-tags">{[...(connection.companion_wellbeing.mood ?? []), ...(connection.companion_wellbeing.symptoms ?? []), connection.companion_wellbeing.category ?? '', connection.companion_wellbeing.energy_level ? `Energy ${connection.companion_wellbeing.energy_level}/5` : ''].filter(Boolean).map(tag => <span key={tag}>{tag}</span>)}</div>
                    {connection.companion_wellbeing.notes && <blockquote>{connection.companion_wellbeing.notes}</blockquote>}
                    <p className="cosmic-fineprint">A kind check-in and a listening ear can be meaningful support.</p>
                </section>}
                {permissions?.astrology && <section className="cosmic-week-card cosmic-support-shared-card">
                    <p className="cosmic-eyebrow">THE TWO OF YOU, CELESTIALLY</p><h2>Shared astrology</h2><p className="cosmic-muted">A reflective, just-for-fun look at your natal signs. Birth time and place can help refine time-sensitive placements.</p>
                    <div className="cosmic-support-signs"><article><span>☉</span><small>Your Sun</small><strong>{data.profile.sun_sign ?? 'Add your birth date'}</strong></article><article><span>☾</span><small>Their Sun</small><strong>{connection.companion_sun_sign ?? 'Birth date not added yet'}</strong></article><article><span>✧</span><small>Their Moon</small><strong>{connection.companion_moon_sign ?? 'Not available yet'}</strong></article><article><span>↟</span><small>Their Rising</small><strong>{connection.companion_rising_sign ?? 'Birth time may be needed'}</strong></article></div>
                    <a className="cosmic-support-link" href="/astrology">Explore the Cosmic Atelier →</a><p className="cosmic-fineprint">Astrology is for reflection and entertainment, not a prediction or relationship diagnosis.</p>
                </section>}
                <section className="cosmic-week-card cosmic-support-next"><p className="cosmic-eyebrow">STAY CONNECTED</p><h2>Keep the conversation open</h2><p>Your partner's private notes and connection reflections live in the shared space. You can visit Connections to read or write a note and see any available relationship insights.</p><a className="cosmic-support-link" href="/connections">Open Connections →</a></section>
            </>}
 <footer className="cosmic-footer"><a className="cosmic-brand" href="/dashboard"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a><p>Your journey, your boundaries, your little universe.</p><div><a href="/connections">Connections</a><a href="/profile">Profile & settings</a></div></footer>
        </main>
    </div>;
}
