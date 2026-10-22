import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function InstallAppPrompt() {
    const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);
    const [message, setMessage] = useState('');
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone) {
            setInstalled(true);
        }
        const onInstall = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as InstallPromptEvent);
        };
        const onInstalled = () => { setInstalled(true); setInstallEvent(null); setMessage('Crescent is installed on this phone.'); };
        window.addEventListener('beforeinstallprompt', onInstall);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    if (installed) return null;
    const install = async () => {
        if (installEvent) {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === 'accepted') setMessage('Crescent is being added to your Home Screen.');
            setInstallEvent(null);
            return;
        }
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setHelpOpen(true);
        setMessage(isIOS
            ? 'On iPhone or iPad, open this page in Safari and use Share → Add to Home Screen.'
            : 'If your browser supports installation, use its Install app option. Check the steps below if it is not offered.');
    };

    return <aside className="crescent-install-prompt" aria-label="Install Crescent">
        <span className="crescent-install-mark" aria-hidden="true">☾</span>
        <div className="crescent-install-copy">
            <strong>Take Crescent with you</strong>
            <span>Install it on your phone for an app-like experience.</span>
            {message && <span role="status">{message}</span>}
            {helpOpen && <div className="crescent-install-help"><strong>Install Crescent on your phone</strong><ol><li><b>Android (Chrome):</b> tap ⋮, then “Install app” or “Add to Home screen”.</li><li><b>iPhone/iPad:</b> open Crescent in Safari, tap Share, scroll to “Add to Home Screen”, then tap Add.</li><li>If no install option appears, update your browser and open the secure Crescent website directly—not inside another app.</li></ol><button type="button" onClick={() => setHelpOpen(false)}>Got it</button></div>}
        </div>
        <button type="button" onClick={install}>Install</button>
        <button type="button" className="crescent-install-dismiss" aria-label="Dismiss install prompt" onClick={() => setInstalled(true)}>×</button>
    </aside>;
}
