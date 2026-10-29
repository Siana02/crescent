import { useEffect, useState } from 'react';

const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
const DISMISSED_KEY = 'crescent-notification-prompt-dismissed';

function decodeKey(value: string) {
  const base64 = (value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

const settingsHelp = () => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'Open the iPhone Settings app → Notifications → Crescent, then switch on Allow Notifications.';
  if (/android/i.test(ua)) return 'Open your phone Settings → Apps → Crescent → Notifications, then switch notifications on.';
  return 'Open your browser or device settings for this site and allow notifications.';
};

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (localStorage.getItem(DISMISSED_KEY) || Notification.permission !== 'default') return;
    fetch('/api/notifications/preferences', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.configured && !(data.subscription_count > 0)) setVisible(true); })
      .catch(() => undefined);
  }, []);

  const dismiss = () => { localStorage.setItem(DISMISSED_KEY, '1'); setVisible(false); };

  async function allow() {
    setBusy(true); setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage(`Notifications are blocked for Crescent. ${settingsHelp()}`);
        localStorage.setItem(DISMISSED_KEY, '1');
        return;
      }
      const keyResponse = await fetch('/api/push/public-key', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!keyResponse.ok) throw new Error('Crescent could not load its push configuration.');
      const { public_key } = await keyResponse.json();
      const registration = await navigator.serviceWorker.ready;
      const subscription = (await registration.pushManager.getSubscription())
        ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(public_key) });
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error('Could not save this device subscription.');
      setMessage('Notifications are on. If you do not receive any, check your phone settings: ' + settingsHelp());
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not enable notifications.');
    } finally { setBusy(false); }
  }

  if (!visible) return null;
  return <section className="cosmic-week-card crescent-notification-prompt" role="dialog" aria-label="Turn on notifications">
    <h2 className="cosmic-page-heading">Turn on notifications? ☾</h2>
    <p>Get gentle, private reminders and partner updates. Lock-screen messages never show personal details.</p>
    <div className="crescent-notification-actions">
      <button type="button" disabled={busy} onClick={allow}>{busy ? 'Setting up…' : 'Yes, turn on'}</button>
      <button type="button" disabled={busy} onClick={dismiss}>Not now</button>
    </div>
    {message && <p role="status" className="cosmic-fineprint">{message}</p>}
  </section>;
}
