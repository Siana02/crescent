import { useEffect, useState } from 'react';
import '../styles/cosmic-dashboard.css';

type Compatibility = { available: boolean; score: number | null; summary: string };

export default function SharedCompatibilityCard({ relationshipId, names }: { relationshipId: number; names: string }) {
    const [data, setData] = useState<Compatibility | null>(null);
    useEffect(() => {
        let live = true;
        fetch('/api/relationships/' + relationshipId + '/insights', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then(response => (response.ok ? response.json() : null))
            .then(payload => { if (live && payload?.compatibility) setData(payload.compatibility as Compatibility); })
            .catch(() => undefined);
        return () => { live = false; };
    }, [relationshipId]);
    return <article className="cosmic-support-compat-card">
        <span aria-hidden="true">☾</span>
        <div>
            <p className="cosmic-eyebrow">COSMIC COMPATIBILITY</p>
            <h3>{data?.available && data.score != null ? data.score + '% reflective snapshot · ' + names : 'Cosmic compatibility · ' + names}</h3>
            <p>{data?.summary ?? 'Opt in to astrology and add birth details to explore your natal connection.'}</p>
        </div>
    </article>;
}
