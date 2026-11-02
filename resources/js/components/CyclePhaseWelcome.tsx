import { Flower2, Leaf, MoonStar, Sparkles, X } from 'lucide-react';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

const copy: Record<CyclePhase, { eyebrow: string; title: string; subtitle: string; note: string; confirm: string }> = {
    menstrual: {
        eyebrow: 'A NEW CHAPTER',
        title: 'A softer season begins',
        subtitle: 'You’re entering your menstrual phase.',
        note: 'Your period is expected to start today. Take a moment to slow down, listen to your body and give yourself a little extra care.',
        confirm: 'My period has started',
    },
    follicular: {
        eyebrow: 'A FRESH BEGINNING',
        title: 'A little room to bloom',
        subtitle: 'You’re entering your follicular phase.',
        note: 'Your cycle is moving into a fresh chapter. This phase is an estimate based on the dates you have shared.',
        confirm: 'This phase feels right',
    },
    ovulatory: {
        eyebrow: 'YOUR FULL BLOOM',
        title: 'A brighter little moment',
        subtitle: 'You’re entering your ovulatory phase.',
        note: 'Your ovulatory window is estimated to begin today. This is a prediction, not confirmation that ovulation has occurred.',
        confirm: 'This phase feels right',
    },
    luteal: {
        eyebrow: 'A MOMENT TO TURN INWARD',
        title: 'A gentler rhythm',
        subtitle: 'You’re entering your luteal phase.',
        note: 'Your cycle is estimated to be moving into its luteal chapter. Make room for the pace that feels right to you.',
        confirm: 'This phase feels right',
    },
};

const icons = {
    menstrual: Flower2,
    follicular: Leaf,
    ovulatory: Sparkles,
    luteal: MoonStar,
};

export default function CyclePhaseWelcome({
    phase,
    estimated,
    busy = false,
    onRespond,
}: {
    phase: CyclePhase;
    estimated: boolean;
    busy?: boolean;
    onRespond: (action: 'confirm' | 'dismiss') => void;
}) {
    const content = copy[phase];
    const Icon = icons[phase];

    return (
        <div className={'cycle-phase-welcome cycle-phase-welcome--' + phase} role="dialog" aria-modal="true" aria-labelledby="cycle-phase-welcome-title">
            <div className="cycle-phase-welcome__backdrop" />
            <section className="cycle-phase-welcome__panel">
                <button className="cycle-phase-welcome__close" type="button" aria-label="Dismiss this presentation" onClick={() => onRespond('dismiss')} disabled={busy}>
                    <X size={17} />
                </button>
                <div className="cycle-phase-welcome__art" aria-hidden="true">
                    <span className="cycle-phase-welcome__spark cycle-phase-welcome__spark--one">✧</span>
                    <span className="cycle-phase-welcome__spark cycle-phase-welcome__spark--two">✦</span>
                    <Icon size={44} strokeWidth={1.25} />
                    <span className="cycle-phase-welcome__petal">✿</span>
                </div>
                <p className="cycle-phase-welcome__eyebrow">{content.eyebrow}</p>
                <h2 id="cycle-phase-welcome-title">{content.title}</h2>
                <h3>{content.subtitle}</h3>
                <p className="cycle-phase-welcome__note">{content.note}</p>
                <div className="cycle-phase-welcome__actions">
                    <button type="button" className="cycle-phase-welcome__confirm" onClick={() => onRespond('confirm')} disabled={busy}>
                        {busy ? 'Saving…' : content.confirm}
                    </button>
                    <button type="button" className="cycle-phase-welcome__dismiss" onClick={() => onRespond('dismiss')} disabled={busy}>
                        Not right now
                    </button>
                </div>
                <p className="cycle-phase-welcome__footnote">
                    {estimated ? 'A gentle estimate based on your cycle history. You can update your dates at any time.' : 'Based on the period dates you have logged.'}
                </p>
            </section>
        </div>
    );
}
