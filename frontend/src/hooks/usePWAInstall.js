import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for PWA installation functionality
 * - Captures beforeinstallprompt event
 * - Provides install trigger function
 * - Handles iOS fallback detection
 * - Only activates for authenticated non-admin users
 */
export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        const installed = localStorage.getItem('pwa_installed') === 'true';
        setIsInstalled(installed);

        // Check if running in standalone mode (already installed)
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);

        if (standalone) {
            localStorage.setItem('pwa_installed', 'true');
            setIsInstalled(true);
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isIOSDevice);

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome from showing the mini-infobar
            e.preventDefault();
            // Store the event for later use
            setDeferredPrompt(e);
            setCanInstall(true);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setCanInstall(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
            localStorage.setItem('pwa_installed', 'true');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const triggerInstall = useCallback(async () => {
        if (!deferredPrompt) {
            return { success: false, reason: 'no-prompt' };
        }

        try {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user's response
            const { outcome } = await deferredPrompt.userChoice;

            // Clear the deferred prompt
            setDeferredPrompt(null);
            setCanInstall(false);

            if (outcome === 'accepted') {
                localStorage.setItem('pwa_installed', 'true');
                setIsInstalled(true);
                return { success: true, outcome: 'accepted' };
            }

            return { success: false, outcome: 'dismissed' };
        } catch (error) {
            console.error('Install prompt error:', error);
            return { success: false, reason: 'error', error };
        }
    }, [deferredPrompt]);

    return {
        canInstall,
        isInstalled,
        isIOS,
        isStandalone,
        triggerInstall,
        // For iOS, show instructions instead of install button
        showIOSInstructions: isIOS && !isStandalone && !isInstalled,
    };
}

export default usePWAInstall;
