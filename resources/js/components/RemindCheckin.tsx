import { useState } from 'react';

const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

export default function RemindCheckin({ relationshipId, name, alreadySent }: { relationshipId: number; name: string; alreadySent: boolean }) {
    const [sent, setSent] = useState(alreadySent);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function send() {
        setBusy(true); setError('');
        try {
            const response = await fetch('/api/relationships/' + relationshipId + '/remind-checkin', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() } });
            if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Could not send the reminder.');
            setSent(true);
        } catch (exception) { setError(exception instanceof Error ? exception.message : 'Could not send the reminder.'); }
        finally { setBusy(false); }
    }
    if (sent) return <p className="cosmic-remind-sent" role="status"><span aria-hidden="true">✓</span> Your notification has been sent. We will notify you when your partner logs their symptoms.</p>;
    return <div className="cosmic-remind"><button type="button" className="cosmic-remind-button" disabled={busy} onClick={() => void send()}><span aria-hidden="true">♡</span> {busy ? 'Sending…' : 'Remind ' + name + ' to log their symptoms'}</button>{error && <small role="alert">{error}</small>}</div>;
}
