import React from 'react';
import { createRoot } from 'react-dom/client';
import LandingPage from './pages/LandingPage';
import './styles/app.css';

const mount = document.getElementById('app');

if (!mount) {
    throw new Error('Crescent app mount element was not found.');
}

createRoot(mount).render(
    <React.StrictMode>
        <LandingPage />
    </React.StrictMode>,
);
