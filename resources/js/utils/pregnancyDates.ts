/** Date helpers for the pregnancy portal. Mirrors App\Support\PregnancyDating on the server. All dates are YYYY-MM-DD strings. */
export type GestationalAge = { days: number; week: number; dayInWeek: number; trimester: 1 | 2 | 3; daysUntilDue: number };

const DAY_MS = 86_400_000;
function utcDay(value: string): number {
    const [y, m, d] = value.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
}
export function addDays(value: string, days: number): string {
    return new Date(utcDay(value) + days * DAY_MS).toISOString().slice(0, 10);
}
/** Today's calendar date in the given IANA timezone. */
export function todayIn(timezone?: string): string {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
}
export function gestationalAgeOn(dueDate: string, date: string): GestationalAge {
    const daysUntilDue = Math.round((utcDay(dueDate) - utcDay(date)) / DAY_MS);
    const days = Math.max(0, 280 - daysUntilDue);
    const week = Math.floor(days / 7);
    return { days, week, dayInWeek: days % 7, trimester: week <= 13 ? 1 : week <= 27 ? 2 : 3, daysUntilDue };
}
export function ageLabel(age: GestationalAge): string {
    return 'Week ' + age.week + ' + ' + age.dayInWeek + ' day' + (age.dayInWeek === 1 ? '' : 's');
}
export function prettyDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }): string {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(new Date(utcDay(value)));
}
export function monthStart(value: string): string { return value.slice(0, 7) + '-01'; }
export function addMonths(value: string, months: number): string {
    const [y, m] = value.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + months, 1));
    return d.toISOString().slice(0, 10);
}
export function daysInMonth(value: string): number {
    const [y, m] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export function weekdayOf(value: string): number { return new Date(utcDay(value)).getUTCDay(); }
/** Local calendar day for an ISO timestamp, in the given timezone. */
export function dayOfInstant(iso: string, timezone?: string): string { return todayInInstant(new Date(iso), timezone); }
function todayInInstant(date: Date, timezone?: string): string {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    } catch {
        return date.toISOString().slice(0, 10);
    }
}
