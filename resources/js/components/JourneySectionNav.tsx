import '../styles/pregnancy.css';

export type JourneySection = { id: string; label: string };

/** Ordered "today's flow" shortcuts: what matters now first, then reflect, connect and plan ahead. */
export default function JourneySectionNav({ sections }: { sections: JourneySection[] }) {
    return <nav className="journey-section-nav" aria-label="Sections on this page">
        <ol>{sections.map((section, index) => <li key={section.id}><a href={'#' + section.id}><span>{index + 1}</span>{section.label}</a></li>)}</ol>
    </nav>;
}
