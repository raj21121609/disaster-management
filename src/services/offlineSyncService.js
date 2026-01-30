/**
 * offlineSyncService.js
 * Automatic sync orchestrator for offline incidents
 * 
 * Listens for network restoration and syncs queued incidents
 * to Firestore automatically and silently.
 */

import {
    getQueuedIncidents,
    updateIncidentStatus,
    removeIncident
} from './offlineIncidentStore';
import { createIncident } from './incidentService';

let isInitialized = false;
let isSyncing = false;
let syncListeners = [];

/**
 * Initialize the sync service
 * Sets up online/offline event listeners
 */
export function initSyncService() {
    if (isInitialized) return;

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if already online and sync any pending
    if (navigator.onLine) {
        syncQueuedIncidents();
    }

    isInitialized = true;
    console.log('[SyncService] Initialized');
}

/**
 * Handle coming online - trigger sync
 */
function handleOnline() {
    console.log('[SyncService] Network restored - starting sync');
    notifyListeners('online');
    syncQueuedIncidents();
}

/**
 * Handle going offline
 */
function handleOffline() {
    console.log('[SyncService] Network lost - offline mode');
    notifyListeners('offline');
}

/**
 * Sync all queued incidents to Firestore
 * Idempotent - safe to call multiple times
 */
export async function syncQueuedIncidents() {
    // Prevent concurrent syncs
    if (isSyncing) {
        console.log('[SyncService] Sync already in progress');
        return;
    }

    // Don't sync if offline
    if (!navigator.onLine) {
        console.log('[SyncService] Cannot sync - offline');
        return;
    }

    isSyncing = true;
    notifyListeners('syncing');

    try {
        const queued = await getQueuedIncidents();
        console.log('[SyncService] Found', queued.length, 'incidents to sync');

        if (queued.length === 0) {
            isSyncing = false;
            notifyListeners('idle');
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const incident of queued) {
            try {
                // Mark as syncing
                await updateIncidentStatus(incident.id, 'syncing');

                // Prepare data for Firestore
                const incidentData = {
                    ...incident.data,
                    // Add offline metadata
                    submittedOffline: true,
                    offlineId: incident.id,
                    offlineCreatedAt: incident.createdAt,
                    offlineAI: incident.offlineAI,
                    syncedAt: new Date().toISOString(),
                };

                // Send to Firestore via existing service
                await createIncident(incidentData);

                // Remove from local queue on success
                await removeIncident(incident.id);
                successCount++;

                console.log('[SyncService] Synced incident:', incident.id);

            } catch (error) {
                console.error('[SyncService] Failed to sync:', incident.id, error);

                // Mark as failed, increment attempts
                await updateIncidentStatus(incident.id, 'failed', {
                    syncAttempts: (incident.syncAttempts || 0) + 1,
                    lastError: error.message,
                });
                failCount++;
            }
        }

        console.log('[SyncService] Sync complete:', successCount, 'success,', failCount, 'failed');
        notifyListeners('synced', { successCount, failCount });

    } catch (error) {
        console.error('[SyncService] Sync error:', error);
        notifyListeners('error', { error: error.message });
    } finally {
        isSyncing = false;
    }
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
    return {
        isOnline: navigator.onLine,
        isSyncing,
        isInitialized,
    };
}

/**
 * Register a listener for sync events
 * @param {Function} callback - Called with (event, data)
 * @returns {Function} Unsubscribe function
 */
export function onSyncEvent(callback) {
    syncListeners.push(callback);
    return () => {
        syncListeners = syncListeners.filter(l => l !== callback);
    };
}

/**
 * Notify all listeners of sync events
 */
function notifyListeners(event, data = {}) {
    syncListeners.forEach(listener => {
        try {
            listener(event, data);
        } catch (e) {
            console.error('[SyncService] Listener error:', e);
        }
    });
}

/**
 * Force a sync attempt (manual trigger)
 */
export function forceSync() {
    if (navigator.onLine) {
        syncQueuedIncidents();
    }
}

export default {
    initSyncService,
    syncQueuedIncidents,
    getSyncStatus,
    onSyncEvent,
    forceSync,
};
