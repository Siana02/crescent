export type MoonPhase = {
    name: string;
    symbol: string;
    illumination: number;
};

const SYNODIC_MONTH_DAYS = 29.530588853;
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);

const phases = [
    // Boundaries sit halfway between the eight principal phase points.
    { name: 'New moon', symbol: '🌑', threshold: 0.0625 },
    { name: 'Waxing crescent', symbol: '🌒', threshold: 0.1875 },
    { name: 'First quarter', symbol: '🌓', threshold: 0.3125 },
    { name: 'Waxing gibbous', symbol: '🌔', threshold: 0.4375 },
    { name: 'Full moon', symbol: '🌕', threshold: 0.5625 },
    { name: 'Waning gibbous', symbol: '🌖', threshold: 0.6875 },
    { name: 'Last quarter', symbol: '🌗', threshold: 0.8125 },
    { name: 'Waning crescent', symbol: '🌘', threshold: 0.9375 },
    { name: 'New moon', symbol: '🌑', threshold: 1 },
];

export function getMoonPhase(date: Date = new Date()): MoonPhase {
    const daysSinceKnownNewMoon = (date.getTime() - KNOWN_NEW_MOON_UTC) / 86_400_000;
    const age = ((daysSinceKnownNewMoon % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
    const fraction = age / SYNODIC_MONTH_DAYS;
    const phase = phases.find((item) => fraction < item.threshold) ?? phases[0];
    const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);

    return { name: phase.name, symbol: phase.symbol, illumination };
}
