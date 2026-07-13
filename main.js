import { DBManager } from './db.js';

// 1. Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW Registered securely on scope:', registration.scope);

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Naya service worker ready hai, page reload karein
                        window.location.reload();
                    }
                });
            });
        } catch (error) {
            console.error('SW Registration critically failed:', error);
        }
    });
}

// 2. State & Draft Management Object
const AppRuntime = {
    async captureAndSaveState() {
        const formElement = document.getElementById('app-form');
        const criticalData = {
            textDraft: document.getElementById('editor-area')?.value || "",
            currentStep: window.currentWorkflowStep || 0,
            formPayload: {
                userId: crypto.randomUUID ? crypto.randomUUID() : 'session_user',
                // FIX: Incomplete FormData array line ko fix kiya
                formData: formElement ? Array.from(new FormData(formElement).entries()) : []
            }
        };

        // Browser quit hone par analytics/logs serve karne ke liye
        navigator.sendBeacon('/api/log-shutdown', JSON.stringify({ status: 'app_hidden' }));

        // Safely commit state to IndexedDB
        await DBManager.saveState('critical_app_state', criticalData);
    },
    async restoreState() {
        const savedState = await DBManager.getState('critical_app_state');
        if (savedState) {
            const editor = document.getElementById('editor-area');
            if (editor) editor.value = savedState.textDraft;
            window.currentWorkflowStep = savedState.currentStep;
            console.log('State successfully hydrated after unexpected quit.');
        }
    }
};

// 3. THE CRITICAL QUIT GUARDS
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        AppRuntime.captureAndSaveState();
    }
});

window.addEventListener('freeze', () => {
    AppRuntime.captureAndSaveState();
});

window.addEventListener('pagehide', () => {
    AppRuntime.captureAndSaveState();
});

// App Startup Restoring
document.addEventListener('DOMContentLoaded', () => {
    AppRuntime.restoreState();
});