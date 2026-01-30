/**
 * offlineIncidentStore.js
 * IndexedDB wrapper for offline incident queue
 * Uses 'idb' library for cleaner async/await syntax
 */

import { openDB } from 'idb';

const DB_NAME = 'crisis-one-offline';
const DB_VERSION = 1;
const INCIDENT_STORE = 'incidentQueue';

let dbPromise = null;

/**
 * Initialize the IndexedDB database
 * Creates the incidentQueue object store if it doesn't exist
 */
export async function initDB() {
    if (dbPromise) return dbPromise;

    dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create incident queue store if it doesn't exist
            if (!db.objectStoreNames.contains(INCIDENT_STORE)) {
                const store = db.createObjectStore(INCIDENT_STORE, { keyPath: 'id' });
                store.createIndex('status', 'status');
                store.createIndex('createdAt', 'createdAt');
                console.log('[OfflineStore] Created incidentQueue store');
            }
        },
    });

    return dbPromise;
}

/**
 * Generate a UUID for offline incidents
 */
function generateUUID() {
    return 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

/**
 * Queue an incident for later sync
 * @param {Object} incidentData - The incident payload
 * @param {Object} offlineAI - Local AI severity estimate
 * @returns {Object} The queued incident with ID
 */
export async function queueIncident(incidentData, offlineAI) {
    const db = await initDB();

    const queuedIncident = {
        id: generateUUID(),
        data: incidentData,
        createdAt: new Date().toISOString(),
        status: 'queued', // queued | syncing | synced | failed
        syncAttempts: 0,
        offlineAI: offlineAI || null,
        // Marker to identify this was submitted offline
        submittedOffline: true,
    };

    await db.put(INCIDENT_STORE, queuedIncident);
    console.log('[OfflineStore] Incident queued:', queuedIncident.id);

    return queuedIncident;
}

/**
 * Get all queued incidents (status = 'queued' or 'failed')
 * @returns {Array} List of queued incidents
 */
export async function getQueuedIncidents() {
    const db = await initDB();
    const all = await db.getAll(INCIDENT_STORE);
    return all.filter(inc => inc.status === 'queued' || inc.status === 'failed');
}

/**
 * Get all incidents in the offline store
 * @returns {Array} List of all incidents
 */
export async function getAllOfflineIncidents() {
    const db = await initDB();
    return db.getAll(INCIDENT_STORE);
}

/**
 * Update incident status
 * @param {string} id - Incident ID
 * @param {string} status - New status
 * @param {Object} extras - Additional fields to update
 */
export async function updateIncidentStatus(id, status, extras = {}) {
    const db = await initDB();
    const incident = await db.get(INCIDENT_STORE, id);

    if (incident) {
        incident.status = status;
        incident.lastUpdated = new Date().toISOString();
        Object.assign(incident, extras);
        await db.put(INCIDENT_STORE, incident);
        console.log('[OfflineStore] Updated status:', id, status);
    }
}

/**
 * Remove incident from queue (after successful sync)
 * @param {string} id - Incident ID
 */
export async function removeIncident(id) {
    const db = await initDB();
    await db.delete(INCIDENT_STORE, id);
    console.log('[OfflineStore] Removed incident:', id);
}

/**
 * Clear all synced incidents from the store
 */
export async function clearSyncedIncidents() {
    const db = await initDB();
    const all = await db.getAll(INCIDENT_STORE);
    const synced = all.filter(inc => inc.status === 'synced');

    for (const inc of synced) {
        await db.delete(INCIDENT_STORE, inc.id);
    }

    console.log('[OfflineStore] Cleared', synced.length, 'synced incidents');
}

/**
 * Get count of pending incidents
 * @returns {number} Count of queued incidents
 */
export async function getPendingCount() {
    const queued = await getQueuedIncidents();
    return queued.length;
}

export default {
    initDB,
    queueIncident,
    getQueuedIncidents,
    getAllOfflineIncidents,
    updateIncidentStatus,
    removeIncident,
    clearSyncedIncidents,
    getPendingCount,
};
