import React from 'react';
import { createRoot } from 'react-dom/client';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AstrologyPage from './pages/AstrologyPage';
import './styles/app.css';

const mount = document.getElementById('app');

if (!mount) {
    throw new Error('Crescent app mount element was not found.');
}

const path = window.location.pathname;
const page = path === '/astrology'
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
    </React.StrictMode>,
);
