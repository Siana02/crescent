import React from 'react';
import { createRoot } from 'react-dom/client';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AstrologyPage from './pages/AstrologyPage';
import BabyAstrologyPage from './pages/BabyAstrologyPage';
import './styles/app.css';
import InstallAppPrompt from './components/InstallAppPrompt';
import EditorialArticlePage from './pages/EditorialArticlePage';
import CycleHistoryPage from './pages/CycleHistoryPage';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Crescent service worker registration failed:', error);
        });
    });
}

const mount = document.getElementById('app');

if (!mount) {
    throw new Error('Crescent app mount element was not found.');
}

const path = window.location.pathname;
const page = path === '/cycle-history' || path === '/read/cycle-length-guide' || path === '/read/period-length-guide'
    ? <CycleHistoryPage />
    : path.startsWith('/read/')
    ? <EditorialArticlePage />
    : path === '/astrology' && new URLSearchParams(window.location.search).get('subject') === 'baby'
    ? <BabyAstrologyPage />
    : path === '/astrology'
    ? <AstrologyPage />
    : path === '/connections'
    ? <ConnectionsPage />
    : path === '/profile' || path === '/settings'
        ? <ProfileSettingsPage />
        : path === '/dashboard'
    ? <DashboardPage />
    : path === '/onboarding'
        ? <OnboardingPage />
        : path === '/login'
        ? <AuthPage mode="login" />
        : path === '/register'
            ? <AuthPage mode="register" />
            : <LandingPage />;

createRoot(mount).render(
    <React.StrictMode>
        {page}
        {!["/login", "/register", "/"].includes(path) && <InstallAppPrompt />}
    </React.StrictMode>,
);
