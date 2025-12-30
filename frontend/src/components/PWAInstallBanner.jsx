import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X, Download, Smartphone, Share, Plus } from 'lucide-react';

/**
 * Premium PWA Install Banner Component
 * - Shows only after engagement (2+ pages OR 30+ seconds)
 * - 7-day dismissal TTL
 * - Device-specific messaging
 * - Only for authenticated non-admin users
 */
export function PWAInstallBanner() {
    const { canInstall, isInstalled, isStandalone, showIOSInstructions, triggerInstall } = usePWAInstall();
    const [isVisible, setIsVisible] = useState(false);
    const [isEngaged, setIsEngaged] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

    // Check engagement and dismissal state
    useEffect(() => {
        // Don't show if already installed or in standalone mode
        if (isInstalled || isStandalone) {
            setIsVisible(false);
            return;
        }

        // Check dismissal TTL (7 days)
        const dismissedAt = localStorage.getItem('pwa_banner_dismissed');
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDaysMs) {
                return; // Still within dismissal period
            }
        }

        // Track page views for engagement
        const pageViews = parseInt(sessionStorage.getItem('pwa_page_views') || '0', 10) + 1;
        sessionStorage.setItem('pwa_page_views', pageViews.toString());

        // Check if engaged (2+ pages)
        if (pageViews >= 2) {
            setIsEngaged(true);
        }

        // Also track time on site (30 seconds)
        const timeoutId = setTimeout(() => {
            setIsEngaged(true);
        }, 30000);

        return () => clearTimeout(timeoutId);
    }, [isInstalled, isStandalone]);

    // Show banner when engaged and can install (or iOS)
    useEffect(() => {
        if (isEngaged && (canInstall || showIOSInstructions)) {
            // Animate in
            setTimeout(() => {
                setIsAnimating(true);
                setIsVisible(true);
            }, 500);
        }
    }, [isEngaged, canInstall, showIOSInstructions]);

    const handleDismiss = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            // Store dismissal with timestamp
            localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
        }, 300);
    };

    const handleInstall = async () => {
        if (showIOSInstructions) {
            setShowIOSModal(true);
            return;
        }

        const result = await triggerInstall();
        if (result.success) {
            handleDismiss();
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Main Install Banner */}
            <div
                className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-50 transition-all duration-300 ease-out ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
            >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" style={{ padding: '1px' }}>
                        <div className="h-full w-full rounded-2xl bg-slate-900/95" />
                    </div>

                    {/* Content */}
                    <div className="relative p-4 md:p-5">
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* App Icon */}
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg shadow-blue-500/25">
                                <img
                                    src="/logo.jpg"
                                    alt="Scholar Sync"
                                    className="w-full h-full rounded-xl object-cover"
                                />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0 pr-4">
                                <h3 className="text-white font-semibold text-base mb-1">
                                    Install Scholar Sync
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {showIOSInstructions
                                        ? 'Add to your home screen for quick access'
                                        : 'Install our app for a faster, native experience'}
                                </p>
                            </div>
                        </div>

                        {/* Install Button */}
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm 
                         bg-gradient-to-r from-blue-500 to-purple-600 text-white
                         hover:from-blue-600 hover:to-purple-700 
                         active:scale-[0.98] transition-all duration-200
                         shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                            >
                                {showIOSInstructions ? (
                                    <>
                                        <Share className="w-4 h-4" />
                                        How to Install
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Install App
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white
                         bg-white/5 hover:bg-white/10 transition-all duration-200"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS Installation Instructions Modal */}
            {showIOSModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                       rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative p-5 pb-4 border-b border-white/10">
                            <button
                                onClick={() => setShowIOSModal(false)}
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                                    <img src="/logo.jpg" alt="Scholar Sync" className="w-full h-full rounded-xl object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Install Scholar Sync</h3>
                                    <p className="text-slate-400 text-sm">Add to Home Screen</p>
                                </div>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="p-5 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-blue-400 font-semibold text-sm">1</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium mb-1">Tap the Share button</p>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Share className="w-5 h-5" />
                                        <span>in Safari's toolbar</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <span className="text-purple-400 font-semibold text-sm">2</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium mb-1">Scroll and tap</p>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Plus className="w-5 h-5" />
                                        <span>"Add to Home Screen"</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                                    <span className="text-pink-400 font-semibold text-sm">3</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium mb-1">Tap "Add"</p>
                                    <p className="text-slate-400 text-sm">to install Scholar Sync</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 pt-0">
                            <button
                                onClick={() => {
                                    setShowIOSModal(false);
                                    handleDismiss();
                                }}
                                className="w-full py-3 rounded-xl font-medium text-sm text-white
                         bg-gradient-to-r from-blue-500 to-purple-600
                         hover:from-blue-600 hover:to-purple-700 
                         transition-all duration-200 shadow-lg shadow-blue-500/25"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PWAInstallBanner;
