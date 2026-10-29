import '../styles/cosmic-dashboard.css';
import { careIdeasFor, dailyGuidance, phaseFor } from '../utils/supportGuidance';
import SharedPartnerSpace from '../components/SharedPartnerSpace';
import FloralSharedCycleCalendar from '../components/FloralSharedCycleCalendar';
import MobileNavigationMenu from '../components/MobileNavigationMenu';

type SharingKey = 'cycle_details' | 'pregnancy_details' | 'wellbeing_updates' | 'astrology';
type SharingPreferences = Record<SharingKey, boolean>;
type SharedRelationship = {
    id: number;
    relationship_type: 'observer' | 'co_tracker';
    status: 'pending' | 'accepted' | 'revoked';
    companion_name: string | null;
    companion_journey: 'cycle' | 'fertility' | 'pregnancy' | 'postpartum' | null;
    companion_cycle_summary: { last_period_start:string; cycle_day:number; estimated_next_period:string|null; average_cycle_length:number|null; average_period_length:number|null; cycle_regularity:string; fertility_estimate_available:boolean; estimated_ovulation_date:string|null; estimated_fertile_start:string|null; estimated_fertile_end:string|null; period_history:{start_date:string;end_date:string|null}[] } | null;
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
    profile: { relationship_role: 'tracker' | 'support'; display_name?: string | null; birth_date: string | null; sun_sign: string | null; moon_sign: string | null; rising_sign: string | null };
    relationships?: SharedRelationship[];
};
const labels: { key: SharingKey; title: string; icon: string }[] = [
    { key: 'cycle_details', title: 'Cycle updates', icon: 'water_drop' },
    { key: 'pregnancy_details', title: 'Pregnancy updates', icon: 'child_care' },
    { key: 'wellbeing_updates', title: 'Wellbeing check-ins', icon: 'favorite' },
    { key: 'astrology', title: 'Astrology', icon: 'auto_awesome' },
];
const wellbeingLabels: Record<string, { label: string; icon: string }> = {
 calm:{label:'Calm',icon:'spa'},zen:{label:'At peace',icon:'self_improvement'},pelvic_pain:{label:'Pelvic pain',icon:'healing'},painful_bowel_movement:{label:'Painful bowel movements',icon:'favorite'},painful_urination:{label:'Painful urination',icon:'water_drop'},dizziness:{label:'Dizziness',icon:'cyclone'},breast_tenderness:{label:'Breast tenderness',icon:'health_and_safety'},bloating:{label:'Bloating',icon:'spa'},nausea:{label:'Nausea',icon:'medication'},diarrhea:{label:'Diarrhoea',icon:'water_drop'},gas:{label:'Gas',icon:'air'},appetite_increase:{label:'Increased appetite',icon:'restaurant'},sweet_cravings:{label:'Sweet cravings',icon:'cookie'},savoury_cravings:{label:'Savoury cravings',icon:'lunch_dining'},creamy_discharge:{label:'Creamy discharge',icon:'water_drop'},fatigue:{label:'Fatigue',icon:'bedtime'},libido_decrease:{label:'Lower libido',icon:'favorite'}
};
function wellbeingLabel(value:string){return wellbeingLabels[value]??{label:value.replace(/[_-]+/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase()),icon:'spa'};}
function dateLabel(value: string) {
    return new Date(value + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}
function cyclePhase(day: number | null) {
    const phase = phaseFor(day);
    const guidance = dailyGuidance(day);
    return { ...phase, ...guidance };
}
function careIdeas(wellbeing: SharedRelationship['companion_wellbeing'], partnerName: string) {
    const tags = [...(wellbeing?.symptoms ?? []), ...(wellbeing?.mood ?? []), wellbeing?.category ?? ''].join(' ').toLowerCase().replace(/[_-]+/g, ' ');
    const ideas: string[] = [];
    if (/cramp|pain|headache|sore|ache|bloat/.test(tags)) ideas.push('Offer a heat pack, water, a comfortable setup or help with a practical task.');
    if (/tired|fatigue|low energy|exhaust/.test(tags) || (wellbeing?.energy_level != null && wellbeing.energy_level <= 2)) ideas.push(`Take one thing off ${partnerName}'s plate, make or order dinner, and offer an early night or a lie-in.`);
    if (/anxious|stress|overwhelm|sad|low|irritable|angry/.test(tags)) ideas.push('Listen without debating or diagnosing. Ask: “Would you like comfort, help solving it, or a little space?”');
    if (/crav|appetite|hungry/.test(tags)) ideas.push(`Bring a snack or treat ${partnerName} actually wants, without commenting on what they should eat.`);
    if (/happy|good|energ|excited/.test(tags) || (wellbeing?.energy_level != null && wellbeing.energy_level >= 4)) ideas.push(`If ${partnerName} is up for it, suggest a walk, a favourite café, a little date or another activity they enjoy.`);
    if (!ideas.length) ideas.push('Ask what would feel loving today: make dinner, plan something outdoors, run a bath, choose a favourite film or give them uninterrupted rest.');
    return ideas.slice(0, 3);
}


export default function SupportDashboard({ data, onLogout }: { data: SupportDashboardData; onLogout: () => void }) {
    const connection = (data.relationships ?? []).find(item => item.status === 'accepted' && item.relationship_type === 'observer');
    const permissions = connection?.companion_sharing_preferences ?? connection?.sharing_preferences;
    const supportName = data.profile.display_name?.trim() || data.user.name?.trim().split(/\s+/)[0] || 'there';
    const primaryName = connection?.companion_name?.trim() || 'your partner';
    return <div className="cosmic-dashboard cosmic-support-dashboard">
        <header className="cosmic-header">
            <a className="cosmic-brand" href="/dashboard"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a>
            <nav><a className="is-active" href="/dashboard">Home</a><a href="/connections">Connections</a><a href="/astrology">The Cosmic Atelier</a><a href="/profile">Profile & settings</a></nav>
            <div className="cosmic-header__right"><button type="button" onClick={onLogout}>Sign out ↗</button></div>
        <MobileNavigationMenu onLogout={onLogout} /></header>
        <main className="cosmic-main">
            <section className="cosmic-welcome cosmic-connections-welcome">
                <div><p className="cosmic-eyebrow">A LITTLE SPACE TO SHOW UP</p><h1>Hello, {supportName}. <em>{connection ? `You're invited to ${primaryName}'s little Crescent universe.` : 'Your little Crescent universe is waiting for its first connection.'}</em></h1>
                    <p>{connection ? `${primaryName}'s shared Crescent space is ready for you. Explore the updates ${primaryName} chose to share, leave a note, and find small ways to show up with care.` : 'Your support space will feel more personal once you connect with your partner.'}</p>
                    <div className="cosmic-connection-promise"><span>✧</span> Their choices · Your own profile · Gentle connection</div>
                </div><div className="cosmic-welcome__art"><span>💌</span><i>✦</i></div>
            </section>
            {connection?.companion_cycle_summary && permissions?.cycle_details && (() => {
                const summary = connection.companion_cycle_summary!;
                const phase = cyclePhase(summary.cycle_day);
                return <section className={'cosmic-week-card cosmic-support-cycle-hero cosmic-support-cycle-hero--' + phase.key} aria-labelledby="support-cycle-title">
                    <span className="cosmic-support-cycle-spark cosmic-support-cycle-spark--one" aria-hidden="true">✧</span><span className="cosmic-support-cycle-spark cosmic-support-cycle-spark--two" aria-hidden="true">✿</span>
                    <div className="cosmic-support-cycle-copy"><p className="cosmic-eyebrow">{primaryName.toUpperCase()}'S CYCLE JOURNEY · SHARED WITH YOU</p><span className="cosmic-support-phase-pill">☾ {phase.label}</span><h2 id="support-cycle-title">Day {summary.cycle_day}<span> of {primaryName}'s cycle</span></h2><p className="cosmic-support-cycle-lead">{phase.title}</p><p>{phase.summary}</p><p className="cosmic-support-daily-tip"><span aria-hidden="true">✧</span> Today's idea: {phase.tip}</p><div className="cosmic-support-cycle-dates"><div><span>♡</span><small>Last period began</small><strong>{dateLabel(summary.last_period_start)}</strong></div><div><span>✧</span><small>Next period estimate</small><strong>{summary.estimated_next_period ? dateLabel(summary.estimated_next_period) : 'Not available yet'}</strong></div></div><p className="cosmic-fineprint">Cycle day is based on shared dates; the phase is a rough guide using a typical cycle pattern. Neither predicts anyone's mood, energy, fertility or needs.</p></div>
                    <div className="cosmic-support-cycle-orb" aria-hidden="true"><span>☾</span><strong>{summary.cycle_day}</strong><small>CYCLE DAY</small><i>✦</i></div>
                </section>;
            })()}
            {connection?.companion_cycle_summary && permissions?.cycle_details && <FloralSharedCycleCalendar cycle={connection.companion_cycle_summary} ownerName={primaryName} viewerName={supportName} />}
            {connection && permissions?.cycle_details && (() => {
                const day = connection.companion_cycle_summary?.cycle_day ?? null;
                const phase = cyclePhase(day);
                const care = careIdeasFor(day, primaryName);
                return <section className={'cosmic-week-card cosmic-support-care-guide cosmic-support-care-guide--' + phase.key}>
                    <div className="cosmic-support-care-heading"><div><p className="cosmic-eyebrow">YOUR GENTLE CARE GUIDE</p><h2>Small ways to make today softer</h2><p>Use these as ideas, not instructions. {primaryName}'s own words and preferences always come first.</p></div><span aria-hidden="true">♡</span></div>
                    <div className="cosmic-support-care-feature"><span aria-hidden="true">✿</span><div><small>PHASE-AWARE NOTE · {phase.label}</small><h3>{phase.title}</h3><p>{phase.summary}</p><p className="cosmic-support-daily-tip"><span aria-hidden="true">✧</span> Today's idea: {phase.tip}</p></div></div>
                    <div className="cosmic-support-care-ideas"><article><span aria-hidden="true">☀</span><h3>If {primaryName} has energy</h3><p>{care.energy}</p></article><article><span aria-hidden="true">☾</span><h3>If {primaryName} feels drained</h3><p>{care.drained}</p></article><article><span aria-hidden="true">♡</span><h3>If feelings run high</h3><p>{care.feelings}</p></article></div>
                    <p className="cosmic-fineprint">Research-informed possibilities, not guarantees. PMS symptoms vary from person to person and from cycle to cycle.</p>
                </section>;
            })()}
            {!connection ? <section className="cosmic-week-card cosmic-support-empty"><p className="cosmic-eyebrow">YOUR SHARED SPACE</p><h2>No connected space yet</h2><p>Ask your partner for their Cosmic Sync Code. You can connect from the Connections page.</p><a className="cosmic-support-link" href="/connections">Open Connections →</a></section> : <>
                {connection.companion_pregnancy_summary && permissions?.pregnancy_details && <section className="cosmic-week-card cosmic-support-shared-card">
                    <p className="cosmic-eyebrow">PREGNANCY JOURNEY · SHARED WITH YOU</p><div className="cosmic-support-cycle"><span className="material-symbols-rounded">child_care</span><div><h2>{connection.companion_pregnancy_summary.status === 'postpartum' ? 'Postpartum journey' : `Week ${connection.companion_pregnancy_summary.gestational_week ?? '—'} · Trimester ${connection.companion_pregnancy_summary.trimester ?? '—'}`}</h2><p>{connection.companion_pregnancy_summary.status === 'active' ? `Estimated due date · ${dateLabel(connection.companion_pregnancy_summary.due_date)}` : 'A postpartum update from your partner.'}</p>{connection.companion_pregnancy_summary.status === 'active' && connection.companion_pregnancy_summary.days_until_due !== null && <p>{connection.companion_pregnancy_summary.days_until_due} days to estimated due date</p>}</div></div>
                    <p className="cosmic-fineprint">Pregnancy timing is an estimate and does not replace advice from their care team.</p>
                </section>}
                {connection.companion_wellbeing && permissions?.wellbeing_updates && <section className="cosmic-week-card cosmic-support-shared-card cosmic-support-wellbeing-card">
                    <p className="cosmic-eyebrow">A LITTLE WELLBEING CHECK-IN</p><h2>How {primaryName} is feeling</h2><p className="cosmic-muted">Latest update · {dateLabel(connection.companion_wellbeing.log_date)}</p>
                    <div className="cosmic-support-tags">{[...(connection.companion_wellbeing.mood ?? []), ...(connection.companion_wellbeing.symptoms ?? []), connection.companion_wellbeing.category ?? ''].filter(Boolean).filter((tag,index,all)=>all.indexOf(tag)===index).map(tag=>{const item=wellbeingLabel(tag);return <span className="cosmic-wellbeing-pill" key={tag}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span>{item.label}</span>;})}{connection.companion_wellbeing.energy_level != null && <span className="cosmic-wellbeing-pill"><span className="material-symbols-rounded" aria-hidden="true">bolt</span>Energy {connection.companion_wellbeing.energy_level}/5</span>}</div>
                    {connection.companion_wellbeing.notes && <blockquote>{connection.companion_wellbeing.notes}</blockquote>}
                    <div className="cosmic-support-wellbeing-advice"><p className="cosmic-eyebrow">A FEW WAYS TO SHOW UP</p><div>{careIdeas(connection.companion_wellbeing, primaryName).map((idea, index) => <p key={idea}><span aria-hidden="true">{['♡','✿','✧'][index]}</span>{idea}</p>)}</div></div>
                    <p className="cosmic-fineprint">{primaryName}'s check-in is the best guide. These are invitations to offer care, never assumptions about what they need.</p>
                </section>}
                <SharedPartnerSpace />
                <section className="cosmic-week-card cosmic-support-permissions">
                    <div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">{primaryName.toUpperCase()}'S SHARING CHOICES</p><h2>What {primaryName} shares with you</h2></div><span className="cosmic-guide-stamp" aria-hidden="true">♡</span></div>
                    <p className="cosmic-muted">{`These settings were chosen by ${primaryName} before they created the invitation.`} You can view them here; only they can change what is shared.</p>
                    <div className="cosmic-support-permission-list">{labels.map(item => <article key={item.key} className={permissions?.[item.key] ? 'is-enabled' : ''}><span className="material-symbols-rounded">{item.icon}</span><div><strong>{item.title}</strong><small>{permissions?.[item.key] ? 'Your partner has enabled this update.' : 'Your partner has kept this private.'}</small></div><b>{permissions?.[item.key] ? 'Shared' : 'Private'}</b></article>)}</div>
                </section>
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
