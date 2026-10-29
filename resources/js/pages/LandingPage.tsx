import { useState } from 'react';
import Button from '../components/Button';

const journalStories = [
    { slug: 'painful-period-cramps', category: 'THE BODY / PAIN & PERIODS', title: 'When cramps mean more', image: '/Painful-period-cramps-is-it-normal-or-could-it-be-something-else.jpg', read: '15 MIN READ' },
    { slug: 'menstrual-cycle-stages', category: 'THE BODY / CYCLE LITERACY', title: 'Your cycle, beyond the calendar', image: '/The-different-stages-of-the-menstrual-cycle-symptoms-and-tips.jpg', read: '12 MIN READ' },
    { slug: 'contraception-and-period-products', category: 'YOUR CHOICES / SEXUAL HEALTH', title: 'Protection that fits your life', image: '/The-different-types-of-conteaceptives-and-different-methods-of-period-blood-collection-explained.jpg', read: '15 MIN READ' },
    { slug: 'vaginal-discharge', category: 'BODY LITERACY / VAGINAL HEALTH', title: 'What discharge can tell you', image: '/Vaginal-discharge-the-different-types-and-colors-explained-how-to-spot-yeast-infection-when-to-seek-help.jpg', read: '12 MIN READ' },
    { slug: 'pregnancy-or-pms', category: 'CYCLE QUESTIONS / PREGNANCY', title: 'PMS or pregnancy?', image: '/pregnancy-or-pms-the-symptoms-explained.jpg', read: '15 MIN READ' },
];

const features = [
    {
        number: '01',
        icon: '◔',
        title: 'Your cycle, clearly',
        description:
            'Log periods and symptoms, then build a more useful picture of your personal patterns over time.',
    },
    {
        number: '02',
        icon: '☾',
        title: 'A little lunar wonder',
        description:
            'Explore the moon’s changing phases alongside your cycle, with curiosity instead of assumptions.',
    },
    {
        number: '03',
        icon: '✳',
        title: 'Insights with care',
        description:
            'Reflect on what you notice with gentle, understandable insights that keep your experience at the centre.',
    },
];

function CrescentMark() {
    return (
        <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" role="presentation">
                <circle cx="20" cy="20" r="16" fill="currentColor" opacity=".13" />
                <path
                    d="M25.8 7.8a13.2 13.2 0 1 0 6.4 23.1A14.8 14.8 0 0 1 25.8 7.8Z"
                    fill="currentColor"
                />
                <circle cx="29.5" cy="10.5" r="1.5" fill="currentColor" />
            </svg>
        </span>
    );
}

function MoonArtwork() {
    return (
        <div className="moon-art" aria-label="Illustration of a crescent moon in a soft twilight sky" role="img">
            <div className="moon-art__halo moon-art__halo--outer" />
            <div className="moon-art__halo moon-art__halo--inner" />
            <span className="moon-art__star moon-art__star--one">✦</span>
            <span className="moon-art__star moon-art__star--two">✧</span>
            <span className="moon-art__star moon-art__star--three">✧</span>
            <span className="moon-art__star moon-art__star--four">·</span>
            <span className="moon-art__star moon-art__star--five">✦</span>
            <div className="moon-art__moon">
                <span />
            </div>
            <div className="moon-art__ground">
                <span className="moon-art__hill moon-art__hill--back" />
                <span className="moon-art__hill moon-art__hill--front" />
            </div>
            <div className="moon-art__label">
                <span className="moon-art__label-dot" />
                A moment to check in with yourself
            </div>
        </div>
    );
}

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="site-shell">
            <header className="site-header">
                <a className="brand" href="#home" aria-label="Crescent home">
                    <CrescentMark />
                    <span className="brand-word">crescent<span>.</span></span>
                </a>

                <nav id="primary-navigation" className={isMenuOpen ? 'desktop-nav desktop-nav--open' : 'desktop-nav'} aria-label="Main navigation">
                    <a href="#why-crescent" onClick={() => setIsMenuOpen(false)}>Why Crescent</a>
                    <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it works</a>
                    <a href="#our-promise" onClick={() => setIsMenuOpen(false)}>Our promise</a>
                    <a href="#journal" onClick={() => setIsMenuOpen(false)}>The journal</a>
                    <a href="/login" onClick={() => setIsMenuOpen(false)}>Log in</a>
                </nav>

                <button
                    className="menu-toggle"
                    type="button"
                    aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-controls="primary-navigation"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    <span className="menu-toggle__lines" aria-hidden="true"><span /><span /><span /></span>
                </button>

                <Button href="/register" variant="outline" shape="square" className="header-link" onClick={() => setIsMenuOpen(false)}>
                    Your journey <span className="button__icon" aria-hidden="true">↗</span>
                </Button>
            </header>

            <main>
                <section className="hero" id="home">
                    <div className="hero-copy">
                        <div className="eyebrow">
                            <span className="eyebrow-dot" />
                            A SOFTER WAY TO TRACK YOUR CYCLE
                        </div>

                        <h1>
                            Get to know your body.
                            <em>Find your own rhythm.</em>
                        </h1>

                        <p className="hero-description">
                            Your cycle is part of your story, not the whole story.
                            Crescent gives you a calm, private place to track your
                            period, explore lunar phases, and notice the patterns
                            that matter to you.
                        </p>

                        <div className="hero-actions" id="get-started">
                            <Button href="#how-it-works" variant="primary" shape="square">
                                Explore Crescent <span className="button__icon" aria-hidden="true">→</span>
                            </Button>
                            <Button href="#our-promise" variant="quiet" shape="square">
                                Get to know us
                            </Button>
                        </div>

                        <div className="hero-footnote">
                            <span className="hero-footnote__icon" aria-hidden="true">♡</span>
                            Made for your body, your boundaries, your way.
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="visual-note visual-note--top">
                            <span className="visual-note__icon">✧</span>
                            <span><strong>Your pace.</strong><small>Your own rhythm.</small></span>
                        </div>
                        <MoonArtwork />
                        <div className="visual-note visual-note--bottom">
                            <span className="visual-note__icon visual-note__icon--rose">♡</span>
                            <span><strong>Space to notice</strong><small>Never pressure to predict.</small></span>
                        </div>
                    </div>

                    <div className="hero-scroll" aria-hidden="true">
                        <span /> A LITTLE MORE IN TUNE WITH YOU
                    </div>
                </section>

                <section className="intro-band" id="why-crescent">
                    <p className="intro-band__overline">CYCLE CARE, WITH ROOM TO BREATHE</p>
                    <h2>
                        Not another thing to keep up with.
                        <br />
                        <em>A little more care for yourself.</em>
                    </h2>
                    <p>
                        No pressure to fit a template. No assumptions about what
                        your cycle should look like. Just thoughtful tools to help
                        you learn, reflect, and feel more connected to yourself.
                    </p>
                </section>

                <section className="features-section" id="how-it-works">
                    <div className="section-heading">
                        <div className="eyebrow eyebrow--center">THOUGHTFULLY MADE FOR YOU</div>
                        <h2>Small moments. <em>More understanding.</em></h2>
                        <p>Everything begins with listening to your own experience.</p>
                    </div>

                    <div className="feature-grid">
                        {features.map((feature) => (
                            <article className="feature-card" key={feature.number}>
                                <div className="feature-card__top">
                                    <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
                                    <span className="feature-card__number">{feature.number}</span>
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <span className="feature-card__line" />
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing-journal" id="journal">
                    <div className="landing-journal-heading">
                        <div>
                            <p className="editorial-kicker">THE CRESCENT JOURNAL</p>
                            <h2>Knowledge is a kind of <em>self-care.</em></h2>
                            <p>Evidence-informed stories for understanding your body, with more nuance and less noise.</p>
                        </div>
                        <span className="landing-journal-edition">BODY, BEAUTY<br />& KNOWLEDGE <b>✳</b></span>
                    </div>
                    <div className="landing-journal-grid">
                        {journalStories.map((story, index) => (
                            <a className={'landing-journal-card landing-journal-card--' + (index + 1)} href={'/read/' + story.slug} key={story.slug}>
                                <div className="landing-journal-image"><img src={story.image} alt="" loading="lazy" /><span>{String(index + 1).padStart(2, '0')}</span></div>
                                <div className="landing-journal-copy"><p>{story.category}</p><h3>{story.title}</h3><div><small>{story.read}</small><span>READ ARTICLE ↗</span></div></div>
                            </a>
                        ))}
                    </div>
                    <p className="landing-journal-note">Grounded in recognised health guidance. Made to inform, never to diagnose.</p>
                </section>

                <section className="promise-section" id="our-promise">
                    <div className="promise-art" aria-hidden="true">
                        <div className="promise-art__circle">
                            <CrescentMark />
                            <span className="promise-art__spark promise-art__spark--one">✧</span>
                            <span className="promise-art__spark promise-art__spark--two">✦</span>
                            <span className="promise-art__orbit" />
                        </div>
                    </div>
                    <div className="promise-copy">
                        <div className="eyebrow">YOUR BODY IS YOURS</div>
                        <h2>Care should feel like <em>care.</em></h2>
                        <p>
                            Your cycle data is personal. Crescent is being built
                            with privacy, clear choices, and inclusive support at
                            its heart. You decide what you record and what you share.
                        </p>
                        <a className="text-link" href="#home">
                            A little more about Crescent <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                </section>

                <section className="closing-cta">
                    <span className="closing-cta__moon" aria-hidden="true">☾</span>
                    <p className="closing-cta__overline">THERE IS NO ONE WAY TO BE YOU</p>
                    <h2>Begin wherever <em>you are.</em></h2>
                    <p>Make a little space for noticing, learning, and caring for yourself.</p>
                    <Button href="/register" variant="light" shape="square" className="closing-cta__button">Come as you are <span className="button__icon" aria-hidden="true">→</span></Button>
                </section>
            </main>

            <footer className="site-footer">
                <a className="brand brand--footer" href="#home">
                    <CrescentMark />
                    <span className="brand-word">crescent<span>.</span></span>
                </a>
                <p>Made with care, for every cycle.</p>
                <nav className="site-footer__legal" aria-label="Legal and help"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Help &amp; support</a></nav>
                <span className="site-footer__copyright">© {new Date().getFullYear()} Crescent</span>
            </footer>
        </div>
    );
}
