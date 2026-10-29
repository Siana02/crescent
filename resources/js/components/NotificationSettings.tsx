import { useEffect, useState } from 'react';

type Preferences = {
  push_enabled: boolean;
  shared_notes: boolean;
  partner_updates: boolean;
  cycle_reminders: boolean;
  daily_checkin_reminders: boolean;
};
const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
const defaults: Preferences = { push_enabled: false, shared_notes: true, partner_updates: true, cycle_reminders: false, daily_checkin_reminders: false };

function decodeKey(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [subscribed, setSubscribed] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/notifications/preferences', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load notification settings.');
        return response.json();
      })
      .then(data => {
        setPreferences({ ...defaults, ...data.preferences, private_previews: false });
        setSubscribed(data.subscription_count > 0);
        setConfigured(Boolean(data.configured));
      })
      .catch(error => setMessage(error instanceof Error ? error.message : 'Could not load notification settings.'));
  }, []);

  async function save(next: Preferences) {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PUT', credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
      body: JSON.stringify(next),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Could not save preferences.');
    setPreferences({ ...defaults, ...result.preferences, private_previews: false });
    return result.preferences as Preferences;
  }

  async function enablePush() {
    setBusy(true); setMessage('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('Push notifications are not supported by this browser. Try a supported browser or install Crescent from your Home Screen.');
      }
      if (!configured) throw new Error('Push delivery is not configured on the server yet. VAPID keys and the web-push server package are required.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notifications are blocked for Crescent. Browsers cannot open settings for you: on iPhone go to Settings → Notifications → Crescent; on Android go to Settings → Apps → Crescent → Notifications; then come back and tap Enable again.');
      const keyResponse = await fetch('/api/push/public-key', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!keyResponse.ok) throw new Error('Crescent could not load its push configuration.');
      const { public_key } = await keyResponse.json();
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(public_key) });
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Could not save this device subscription.');
      const next = { ...preferences, push_enabled: true };
      await save(next);
      setSubscribed(true);
      setMessage('Notifications are enabled for this device. Lock-screen messages use neutral wording.');
    } catch (error) {
      // Keep the control aligned with the browser and server subscription state after partial failures.
      try {
        const registration = await navigator.serviceWorker.ready;
        setSubscribed(Boolean(await registration.pushManager.getSubscription()));
      } catch { /* preserve the last known state when the browser API is unavailable */ }
      setMessage(error instanceof Error ? error.message : 'Could not enable notifications.');
    } finally { setBusy(false); }
  }

  async function disablePush() {
    setBusy(true); setMessage('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE', credentials: 'same-origin',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      const next = { ...preferences, push_enabled: false };
      await save(next);
      setSubscribed(false);
      setMessage('Push notifications are off for this device.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not disable notifications.'); }
    finally { setBusy(false); }
  }

  async function sendTest() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/notifications/test', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() } });
      const result = await response.json().catch(() => ({}));
      setMessage(result.message || (response.ok ? 'Test notification sent.' : 'Could not send a test notification.'));
    } catch { setMessage('Could not send a test notification.'); }
    finally { setBusy(false); }
  }

  async function toggle(key: keyof Preferences, checked: boolean) {
    const next = { ...preferences, [key]: checked };
    try { await save(next); setMessage('Notification preferences saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save preferences.'); }
  }

  return <section className="cosmic-settings-divider crescent-notification-settings">
    <h2 className="cosmic-page-heading">Crescent notifications ☾</h2>
    <p>Choose what you want Crescent to gently remind you about on this device. Each partner manages their own notification settings.</p>
    <div className="crescent-notification-options">
      {([
        ['shared_notes', 'Shared notes', 'Let me know when my partner leaves a note.'],
        ['partner_updates', 'Partner updates', 'Receive permitted updates from my connection.'],
        ['cycle_reminders', 'Cycle reminders', 'Optional reminders for my own tracking.'],
        ['daily_checkin_reminders', 'Daily check-in nudges', 'A gentle reminder to check in with myself.'],
      ] as [keyof Preferences, string, string][]).map(([key, title, detail]) =>
        <label className="cosmic-settings-toggle" key={key}>
          <input type="checkbox" checked={Boolean(preferences[key])} disabled={key === 'push_enabled'} onChange={event => toggle(key, event.target.checked)} />
          <span><strong>{title}</strong><small>{detail}</small></span>
        </label>
      )}
    </div>
    <div className="crescent-notification-actions">
      {subscribed
        ? <><button type="button" disabled={busy} onClick={sendTest}>Send a test notification</button><button type="button" disabled={busy} onClick={disablePush}>{busy ? 'Updating…' : 'Turn off push notifications'}</button></>
        : <button type="button" disabled={busy} onClick={enablePush}>{busy ? 'Setting up…' : 'Enable push notifications'}</button>}
    </div>
    <p className="cosmic-fineprint">Privacy first: lock-screen notifications never include period dates, symptoms, fertility details, or shared note text. You can turn notifications off at any time in Crescent or your phone settings.</p>
    {message && <p role="status" className="cosmic-fineprint">{message}</p>}
  </section>;
}
