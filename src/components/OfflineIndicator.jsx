import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Check } from 'lucide-react';
import { getSyncStatus, onSyncEvent, forceSync } from '../services/offlineSyncService';
import { getPendingCount } from '../services/offlineIncidentStore';
import './OfflineIndicator.css';

/**
 * OfflineIndicator - Global network status banner
 * Shows offline status and pending sync count
 */
const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [showSynced, setShowSynced] = useState(false);

    useEffect(() => {
        // Update pending count
        const updatePending = async () => {
            const count = await getPendingCount();
            setPendingCount(count);
        };
        updatePending();

        // Listen for online/offline
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for sync events
        const unsubscribe = onSyncEvent((event, data) => {
            switch (event) {
                case 'online':
                    setIsOnline(true);
                    break;
                case 'offline':
                    setIsOnline(false);
                    break;
                case 'syncing':
                    setIsSyncing(true);
                    break;
                case 'synced':
                    setIsSyncing(false);
                    updatePending();
                    // Show success briefly
                    if (data.successCount > 0) {
                        setShowSynced(true);
                        setTimeout(() => setShowSynced(false), 3000);
                    }
                    break;
                case 'idle':
                case 'error':
                    setIsSyncing(false);
                    updatePending();
                    break;
            }
        });

        // Refresh pending count periodically
        const interval = setInterval(updatePending, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    // Don't show if online with no pending items and not syncing
    if (isOnline && pendingCount === 0 && !isSyncing && !showSynced) {
        return null;
    }

    return (
        <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
            <div className="offline-content">
                {!isOnline && (
                    <>
                        <WifiOff size={16} className="offline-icon" />
                        <span className="offline-text">
                            Offline Mode
                            {pendingCount > 0 && (
                                <span className="pending-badge">
                                    {pendingCount} queued
                                </span>
                            )}
                        </span>
                    </>
                )}

                {isOnline && isSyncing && (
                    <>
                        <RefreshCw size={16} className="offline-icon spinning" />
                        <span className="offline-text">Syncing incidents...</span>
                    </>
                )}

                {isOnline && showSynced && !isSyncing && (
                    <>
                        <Check size={16} className="offline-icon success" />
                        <span className="offline-text">Incidents synced!</span>
                    </>
                )}

                {isOnline && pendingCount > 0 && !isSyncing && !showSynced && (
                    <>
                        <Wifi size={16} className="offline-icon" />
                        <span className="offline-text">
                            {pendingCount} pending
                        </span>
                        <button
                            className="sync-btn"
                            onClick={forceSync}
                        >
                            Sync Now
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default OfflineIndicator;
