import { useEffect, useRef, useState } from 'react';
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
    phaseStartDate,
    today,
    busy = false,
    onRespond,
}: {
    phase: CyclePhase;
    estimated: boolean;
    busy?: boolean;
    phaseStartDate: string;
    today: string;
    onRespond: (action: 'confirm' | 'dismiss', startDate?: string) => void;
}) {
    const [periodStartDate, setPeriodStartDate] = useState(phaseStartDate || today);
    const panelRef = useRef<HTMLElement>(null);
    const onRespondRef = useRef(onRespond);
    const busyRef = useRef(busy);

    useEffect(() => {
        onRespondRef.current = onRespond;
        busyRef.current = busy;
    }, [busy, onRespond]);

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], select:not(:disabled), textarea:not(:disabled)'));
        focusable()[0]?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busyRef.current) {
                event.preventDefault();
                onRespondRef.current('dismiss');
                return;
            }
            if (event.key !== 'Tab') return;
            const items = focusable();
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    const content = copy[phase];
    const Icon = icons[phase];

    return (
        <div className={'cycle-phase-welcome cycle-phase-welcome--' + phase} role="dialog" aria-modal="true" aria-labelledby="cycle-phase-welcome-title" aria-describedby="cycle-phase-welcome-note">
            <div className="cycle-phase-welcome__backdrop" />
            <section className="cycle-phase-welcome__panel" ref={panelRef}>
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
                <p className="cycle-phase-welcome__note" id="cycle-phase-welcome-note">{content.note}</p>
                {phase === 'menstrual' && (
                    <label className="cycle-phase-welcome__date">
                        When did your period begin?
                        <input type="date" value={periodStartDate} max={today} onChange={event => setPeriodStartDate(event.target.value)} />
                    </label>
                )}
                <div className="cycle-phase-welcome__actions">
                    <button type="button" className="cycle-phase-welcome__confirm" onClick={() => onRespond('confirm', phase === 'menstrual' ? periodStartDate : undefined)} disabled={busy}>
                        {busy ? 'Saving…' : content.confirm}
                    </button>
                    <button type="button" className="cycle-phase-welcome__dismiss" onClick={() => onRespond('dismiss')} disabled={busy}>
                        Not right now
                    </button>
                </div>
                <a className="cycle-phase-welcome__correct" href="/cycle-history">Something feels different? Correct my cycle</a>
                <p className="cycle-phase-welcome__footnote">
                    {estimated ? 'A gentle estimate based on your cycle history. You can update your dates at any time.' : 'Based on the period dates you have logged.'}
                </p>
            </section>
        </div>
    );
}
