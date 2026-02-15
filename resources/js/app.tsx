import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from 'sonner';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize Telegram WebApp and configure axios + Inertia
if (typeof window !== 'undefined') {
    const telegram = (window as any).Telegram;

    console.log('🔍 Telegram WebApp Debug:', {
        exists: !!telegram?.WebApp,
        initData: telegram?.WebApp?.initData || 'NONE',
        initDataUnsafe: telegram?.WebApp?.initDataUnsafe || 'NONE',
        user: telegram?.WebApp?.initDataUnsafe?.user || 'NONE',
        platform: telegram?.WebApp?.platform || 'NONE',
        version: telegram?.WebApp?.version || 'NONE',
    });

    if (telegram?.WebApp) {
        telegram.WebApp.ready();
        telegram.WebApp.expand();

        const initData = telegram.WebApp.initData;

        // Add axios interceptor to include Telegram initData in all axios requests
        axios.interceptors.request.use((config) => {
            console.log('📡 Axios Request:', {
                url: config.url,
                hasInitData: !!initData,
                initDataPreview: initData ? initData.substring(0, 50) + '...' : 'NONE',
            });

            if (initData) {
                config.headers['x-telegram-init-data'] = initData;
            }
            return config;
        });

        // Add Inertia router interceptor to include Telegram initData in all Inertia requests
        router.on('before', (event) => {
            console.log('📡 Inertia Request:', {
                url: event.detail.visit.url,
                method: event.detail.visit.method,
                hasInitData: !!initData,
                initDataPreview: initData ? initData.substring(0, 50) + '...' : 'NONE',
            });

            event.detail.visit.headers = {
                ...event.detail.visit.headers,
                'x-telegram-init-data': initData,
            };
        });
    } else {
        console.warn('⚠️ Telegram WebApp not available - running in browser without Telegram');
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
