import React, { useEffect, useState } from 'react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function InstallAppPrompt() {
    const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);
    const [message, setMessage] = useState('');

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
        setMessage(isIOS
            ? 'To install Crescent: tap Share in Safari, then “Add to Home Screen”.'
            : 'Open your browser menu and choose “Install app” or “Add to Home screen”.');
    };

    return <aside className="crescent-install-prompt" aria-label="Install Crescent">
        <span className="crescent-install-mark" aria-hidden="true">☾</span>
        <div className="crescent-install-copy">
            <strong>Take Crescent with you</strong>
            <span>Install it on your phone for an app-like experience.</span>
            {message && <span role="status">{message}</span>}
        </div>
        <button type="button" onClick={install}>Install</button>
        <button type="button" className="crescent-install-dismiss" aria-label="Dismiss install prompt" onClick={() => setInstalled(true)}>×</button>
    </aside>;
}
