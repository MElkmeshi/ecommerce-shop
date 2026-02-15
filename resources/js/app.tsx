import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from 'sonner';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize Telegram WebApp and configure axios
if (typeof window !== 'undefined') {
    const telegram = (window as any).Telegram;
    if (telegram?.WebApp) {
        telegram.WebApp.ready();
        telegram.WebApp.expand();

        // Add axios interceptor to include Telegram initData in all requests
        axios.interceptors.request.use((config) => {
            const initData = telegram.WebApp.initData;
            if (initData) {
                config.headers['x-telegram-init-data'] = initData;
            }
            return config;
        });
    } else {
        // For local development without Telegram
        axios.interceptors.request.use((config) => {
            // Only add mock header for local development
            if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.test')) {
                config.headers['X-Mock-Telegram-User'] = JSON.stringify({
                    id: 999999,
                    first_name: 'Test',
                    last_name: 'User',
                    username: 'testuser',
                    language_code: 'en',
                });
            }
            return config;
        });
    }
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
                <Toaster position="top-center" richColors />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
