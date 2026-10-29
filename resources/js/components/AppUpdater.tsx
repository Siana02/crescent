import { useEffect, useRef, useState } from 'react';
import '../styles/cosmic-dashboard.css';

type NetworkInformation = { type?: string; effectiveType?: string; saveData?: boolean };

const KEY = 'crescent-app-version';

function onUnmeteredWifi() {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!connection) return false;
    return connection.type === 'wifi' && !connection.saveData;
}

/** Checks for a newer deployed version. On Wi-Fi it updates itself when the app is in the background; otherwise it offers a one-tap update. */
export default function AppUpdater() {
    const [available, setAvailable] = useState(false);
    const latest = useRef<string | null>(null);

    useEffect(() => {
        let stopped = false;
        const check = async () => {
            try {
                const registration = await navigator.serviceWorker?.getRegistration();
                await registration?.update();
                const response = await fetch('/api/app-version', { cache: 'no-store' });
                if (!response.ok) return;
                const { version } = await response.json() as { version: string };
                if (stopped || !version) return;
                latest.current = version;
                const known = localStorage.getItem(KEY);
                if (!known) { localStorage.setItem(KEY, version); return; }
                if (known !== version) {
                    if (onUnmeteredWifi() && document.hidden) { localStorage.setItem(KEY, version); window.location.reload(); return; }
                    setAvailable(true);
                }
            } catch { /* offline: try again later */ }
        };
        void check();
        const timer = window.setInterval(check, 30 * 60 * 1000);
        const onVisible = () => { if (document.visibilityState === 'visible') void check(); else if (latest.current && localStorage.getItem(KEY) !== latest.current && onUnmeteredWifi()) { localStorage.setItem(KEY, latest.current); window.location.reload(); } };
        document.addEventListener('visibilitychange', onVisible);
        return () => { stopped = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
    }, []);

    if (!available) return null;
    return <div className="cosmic-update-banner" role="status"><span aria-hidden="true">✨</span> A new version of Crescent is ready.<button type="button" onClick={() => { if (latest.current) localStorage.setItem(KEY, latest.current); window.location.reload(); }}>Update now</button></div>;
}
