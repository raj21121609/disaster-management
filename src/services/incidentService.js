import {
    onSnapshot,
    collection,
    doc,
    query,
    limit,
    addDoc,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import api from './apiService';

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Filter incidents by distance from user location
export const getNearbyIncidents = (incidents, userLat, userLng, radiusMiles = 15) => {
    if (!incidents || !userLat || !userLng) return incidents || [];

    return incidents
        .map(incident => {
            const incLat = incident.location?.latitude || incident.latitude;
            const incLng = incident.location?.longitude || incident.longitude;

            if (!incLat || !incLng) return { ...incident, distance: Infinity };

            const distance = calculateDistance(userLat, userLng, incLat, incLng);
            return { ...incident, distance };
        })
        .filter(incident => incident.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance);
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
    if (!db) {
        throw new Error('Firebase not configured');
    }

    const newIncident = {
        type: incidentData.type,
        severity: incidentData.severity || 'medium',
        description: incidentData.description || '',
        location: {
            latitude: incidentData.latitude,
            longitude: incidentData.longitude,
            address: incidentData.address || ''
        },
        contactPhone: incidentData.contactPhone || '',
        status: 'reported',
        createdAt: serverTimestamp(),
        createdBy: incidentData.userId || 'anonymous',
        priorityScore: incidentData.priorityScore || 0,
        aiSeverity: incidentData.aiSeverity || incidentData.severity || 'medium',
        assignedVolunteers: [],
        assignedResources: [],
        updates: []
    };

    const docRef = await addDoc(collection(db, INCIDENTS_COLLECTION), newIncident);
    console.log('[NEW INCIDENT] Created:', docRef.id);

    return {
        success: true,
        id: docRef.id,
        ...newIncident,
        createdAt: new Date().toISOString()
    };
};

export const updateIncidentStatus = async (incidentId, status, userId) => {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    const updateData = {
        status: status,
        updatedAt: serverTimestamp(),
        updatedBy: userId || 'anonymous'
    };

    if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
        updateData.resolvedBy = userId || 'anonymous';
    }

    await updateDoc(doc(db, INCIDENTS_COLLECTION, incidentId), updateData);
    return { success: true, incidentId, status };
};

export const assignVolunteer = async (incidentId, volunteerId) => {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    await updateDoc(doc(db, INCIDENTS_COLLECTION, incidentId), {
        assignedVolunteers: arrayUnion(volunteerId),
        status: 'assigned',
        updatedAt: serverTimestamp()
    });
    return { success: true, incidentId, volunteerId };
};

export const unassignVolunteer = async (incidentId, volunteerId) => {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    await updateDoc(doc(db, INCIDENTS_COLLECTION, incidentId), {
        assignedVolunteers: arrayRemove(volunteerId),
        updatedAt: serverTimestamp()
    });
    return { success: true, incidentId, volunteerId };
};

export const assignResource = async (incidentId, resourceId, resourceType) => {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    await updateDoc(doc(db, INCIDENTS_COLLECTION, incidentId), {
        status: 'assigned',
        assignedResources: arrayUnion({
            resourceId,
            resourceType: resourceType || 'unknown',
            assignedAt: new Date().toISOString()
        }),
        updatedAt: serverTimestamp()
    });
    return { success: true, incidentId, resourceId, resourceType };
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