import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import * as Sentry from '@sentry/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

Sentry.init({
    dsn: 'https://475653058bb674ed054c4a1a1041889e@o4509194194386944.ingest.us.sentry.io/4509565339893760',
    _experiments: { enableLogs: true },
    sendDefaultPii: true,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Enable distributed tracing
    tracesSampleRate: 1.0,
    integrations: [
        Sentry.browserTracingIntegration({
            ignoreResourceSpans: ['resource.link']
        }),
        Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
        Sentry.replayIntegration({
            // Additional SDK configuration goes in here, for example:
            maskAllText: false,
            blockAllMedia: false,
            // Mask sensitive input fields like zip codes and postal codes
            mask: [
                'input[id="zip-code"]',
                'input[name="zip_code"]', 
                'input[name="postal_code"]',
                'input[placeholder*="ZIP"]',
                'input[placeholder*="postal"]',
                '.shipping-input'
            ],
        }),
    ],

});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Get CSRF token from meta tag
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
    // Set CSRF token for all requests
    ...(token && { csrf: token }),
});

// This will set light / dark mode on load...
initializeTheme();
