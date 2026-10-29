import type { ReactNode } from 'react';
import SiteCredit from '../components/SiteCredit';
import '../styles/cosmic-dashboard.css';

const EMAIL = 'hello@marswebz.com';
type Kind = 'privacy' | 'terms' | 'support';
type Block = { title: string; body: ReactNode[] };

const mail = <a href={'mailto:' + EMAIL}>{EMAIL}</a>;

const pages: Record<Kind, { eyebrow: string; title: string; intro: string; updated?: string; blocks: Block[] }> = {
    privacy: {
        eyebrow: 'YOUR DATA, YOUR RULES', title: 'Privacy Policy', updated: 'Last updated: October 2026',
        intro: 'Crescent is a private space for tracking your cycle and, if you choose, sharing parts of your journey with someone you trust. This page explains what we collect and how it is used.',
        blocks: [
            { title: 'What we collect', body: ['Account details (name, email), the cycle information you log (periods, symptoms, mood, notes), optional birth details for astrology, your connections and shared messages, and notification settings and device push subscriptions.'] },
            { title: 'How we use it', body: ['We use your information only to run Crescent: showing your cycle, producing estimates, delivering the shared features you turn on, and sending the notifications you opt into. We do not sell your data or use it for advertising.'] },
            { title: 'Sharing is always your choice', body: ['A support partner only sees the categories you switch on (cycle details, pregnancy details, wellbeing updates, astrology). You can change or turn these off at any time, or end the connection.'] },
            { title: 'Notifications', body: ['Lock-screen notifications never contain period dates, symptoms, fertility details or message text. You can turn notifications off in Crescent or in your device settings at any time.'] },
            { title: 'Third-party services', body: ['Astrology content and planetary positions come from CosmyDay. Birth details may be sent to that service to calculate your chart. Push notifications are delivered through your browser or device provider.'] },
            { title: 'Security and retention', body: ['Data is sent over encrypted connections. We keep your information while your account is active. Ask us to delete your account and data at any time.'] },
            { title: 'Your rights', body: ['You can ask to access, correct, export or delete your data. Crescent is not medical software and is not a substitute for medical advice.'] },
            { title: 'Contact', body: [<>Questions about privacy? Email {mail}. We respond within the hour.</>] },
        ],
    },
    terms: {
        eyebrow: 'THE GENTLE FINE PRINT', title: 'Terms of Use', updated: 'Last updated: October 2026',
        intro: 'By using Crescent you agree to these terms. They are written to be short and readable.',
        blocks: [
            { title: 'Using Crescent', body: ['You must be old enough to use online services in your country. Keep your login private and provide accurate information.'] },
            { title: 'Not medical advice', body: ['Crescent gives estimates and general educational information. Cycle predictions, fertile windows and phase guidance can be wrong and must not be used as contraception or a diagnosis. Always speak to a healthcare professional about your health.'] },
            { title: 'Astrology', body: ['Astrology content is for reflection and entertainment only, not prediction or advice.'] },
            { title: 'Respectful connections', body: ['Only connect with people you trust and do not use shared messages to harass or pressure anyone. We may suspend accounts that misuse Crescent.'] },
            { title: 'Your content', body: ['You own what you log and write. You give us permission to store and display it as needed to run the app for you and the people you share with.'] },
            { title: 'Availability and changes', body: ['We work to keep Crescent running but cannot guarantee uninterrupted service. We may update the app and these terms; continued use means you accept the changes.'] },
            { title: 'Contact', body: [<>Questions about these terms? Email {mail}.</>] },
        ],
    },
    support: {
        eyebrow: 'WE ARE HERE FOR YOU', title: 'Help & Support', 
        intro: 'Stuck, confused or something not working? Send every question and issue to one place and a real person will help.',
        blocks: [
            { title: 'Email us', body: [<>Write to {mail}. <strong>We respond within the hour.</strong></>, 'Include what you were doing, the device and browser you use, and a screenshot if you can. Please never send passwords.'] },
            { title: 'Quick fixes', body: ['Notifications not arriving? Open Profile & settings, turn on push notifications and use "Send a test notification". Make sure notifications are allowed in your phone or browser settings.', 'App looks out of date? Close and reopen Crescent, or tap "Update now" when the banner appears. You do not need to uninstall.', 'Cannot connect to your partner? Check the code with them and make sure it has not expired.'] },
            { title: 'Urgent health concerns', body: ['Crescent cannot give medical advice. If you have severe pain, very heavy bleeding or any emergency, contact a doctor or your local emergency service.'] },
        ],
    },
};

export default function LegalPage({ kind }: { kind: Kind }) {
    const page = pages[kind];
    return <div className="cosmic-dashboard">
        <header className="cosmic-header"><a className="cosmic-brand" href="/"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a><nav><a href="/dashboard">Home</a><a className={kind === 'privacy' ? 'is-active' : ''} href="/privacy">Privacy</a><a className={kind === 'terms' ? 'is-active' : ''} href="/terms">Terms</a><a className={kind === 'support' ? 'is-active' : ''} href="/support">Support</a></nav></header>
        <main className="cosmic-main cosmic-legal">
            <section className="cosmic-welcome"><div><p className="cosmic-eyebrow">✧ {page.eyebrow} ✧</p><h1>{page.title}</h1><p>{page.intro}</p>{page.updated && <small>{page.updated}</small>}</div><div className="cosmic-welcome__art"><span>{kind === 'support' ? '💌' : '✿'}</span><i>✦</i></div></section>
            {page.blocks.map(block => <section key={block.title}><h2>{block.title}</h2>{block.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>)}
        </main>
        <footer className="cosmic-footer"><a className="cosmic-brand" href="/"><span className="cosmic-brand__mark">☾</span><span>crescent<span>.</span></span></a><p>Your journey, your boundaries, your little universe.</p><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Help &amp; support</a></div><SiteCredit /></footer>
    </div>;
}
