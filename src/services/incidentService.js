import {
    onSnapshot,
    collection,
    doc,
    query,
    limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import api from './apiService';

// Mock implementation or real one
export const getNearbyIncidents = async (location, radius) => {
    // Placeholder logic
    console.log('Fetching nearby incidents', location, radius);
    return [];
};

const INCIDENTS_COLLECTION = 'incidents';

export const IncidentStatus = {
    REPORTED: 'reported',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    ON_THE_WAY: 'on_the_way',
    RESOLVED: 'resolved',
    CANCELLED: 'cancelled'
};

export const IncidentType = {
    MEDICAL: 'medical',
    FIRE: 'fire',
    ACCIDENT: 'accident',
    FLOOD: 'flood',
    POLICE: 'police',
    OTHER: 'other'
};

export const SeverityLevel = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

export const createIncident = async (incidentData) => {
    const response = await api.post('/incidents', incidentData);
    return response.data;
};

export const updateIncidentStatus = async (incidentId, status, userId) => {
    const response = await api.put(`/incidents/${incidentId}/status`, { status, userId });
    return response.data;
};

export const assignVolunteer = async (incidentId, volunteerId) => {
    const response = await api.post(`/incidents/${incidentId}/volunteers`, { volunteerId });
    return response.data;
};

export const unassignVolunteer = async (incidentId, volunteerId) => {
    const response = await api.delete(`/incidents/${incidentId}/volunteers/${volunteerId}`);
    return response.data;
};

export const assignResource = async (incidentId, resourceId, resourceType) => {
    const response = await api.post(`/incidents/${incidentId}/resources`, { resourceId, resourceType });
    return response.data;
};

export const getIncident = async (incidentId) => {
    const response = await api.get(`/incidents/${incidentId}`);
    return response.data;
};

export const getActiveIncidents = async () => {
    const response = await api.get('/incidents/active');
    return response.data;
};

export const getIncidents = async (filters = {}) => {
    const response = await api.get('/incidents', { params: filters });
    return response.data;
};

export const getIncidentStats = async () => {
    const response = await api.get('/incidents/stats');
    return response.data;
};


// Real-time subscriptions (still using Firestore for this example)

export const subscribeToIncidents = (callback, statusFilter = null) => {
    if (!db) {
        callback([]);
        return () => { };
    }

    const q = query(
        collection(db, INCIDENTS_COLLECTION),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        let incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (statusFilter) {
            incidents = incidents.filter(inc => inc.status === statusFilter);
        }

        incidents.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(0);
            const timeB = b.createdAt?.toDate?.() || new Date(0);
            return timeB - timeA;
        });

        callback(incidents);
    }, (error) => {
        console.error('Incident subscription error:', error);
        callback([]);
    });
};

export const subscribeToActiveIncidents = (callback) => {
    if (!db) {
        callback([]);
        return () => { };
    }

    const q = query(
        collection(db, INCIDENTS_COLLECTION),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const incidents = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(inc =>
                [
                    IncidentStatus.REPORTED,
                    IncidentStatus.ASSIGNED,
                    IncidentStatus.IN_PROGRESS,
                    IncidentStatus.ON_THE_WAY
                ].includes(inc.status)
            )
            .sort((a, b) => {
                const timeA = a.createdAt?.toDate?.() || new Date(0);
                const timeB = b.createdAt?.toDate?.() || new Date(0);
                return timeB - timeA;
            });
        callback(incidents);
    }, (error) => {
        console.error('Active incidents subscription error:', error);
        callback([]);
    });
};

export const subscribeToIncident = (incidentId, callback) => {
    if (!db) {
        callback(null);
        return () => { };
    }

    return onSnapshot(doc(db, INCIDENTS_COLLECTION, incidentId), (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    });
};