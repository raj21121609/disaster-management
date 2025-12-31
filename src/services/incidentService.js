import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    GeoPoint
} from 'firebase/firestore';
import { db } from '../firebase';

const INCIDENTS_COLLECTION = 'incidents';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

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

export const createIncident = async (incidentData, userId, idToken) => {
    if (!db) {
        console.warn('Firestore not initialized - running in demo mode');
        return { id: 'demo-' + Date.now(), ...incidentData };
    }

    let severity = incidentData.severity || 'medium';
    let priorityScore = 50;

    try {
        const response = await fetch(`${BACKEND_URL}/analyze-incident`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                type: incidentData.type,
                description: incidentData.description
            })
        });

        if (response.ok) {
            const analysis = await response.json();
            severity = analysis.severity;
            priorityScore = analysis.priorityScore;
        }
    } catch (error) {
        console.warn('Backend analysis unavailable, using default severity');
    }

    const incident = {
        type: incidentData.type,
        description: incidentData.description || '',
        location: new GeoPoint(
            incidentData.latitude,
            incidentData.longitude
        ),
        address: incidentData.address || 'Unknown Location',
        severity: severity,
        priorityScore: priorityScore,
        status: IncidentStatus.REPORTED,
        reportedBy: userId,
        assignedTo: null,
        assignedVolunteers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        resolvedAt: null,
        photoUrl: incidentData.photoUrl || null,
        contactPhone: incidentData.contactPhone || null
    };

    const docRef = await addDoc(collection(db, INCIDENTS_COLLECTION), incident);
    return { id: docRef.id, ...incident };
};

export const updateIncidentStatus = async (incidentId, status, userId, idToken) => {
    if (!db) {
        console.warn('Firestore not initialized');
        return;
    }

    const updateData = {
        status: status,
        updatedAt: serverTimestamp()
    };

    if (status === IncidentStatus.RESOLVED) {
        updateData.resolvedAt = serverTimestamp();
        updateData.resolvedBy = userId;
    }

    await updateDoc(doc(db, INCIDENTS_COLLECTION, incidentId), updateData);

    try {
        await fetch(`${BACKEND_URL}/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ incidentId, status })
        });
    } catch (error) {
        console.warn('Backend sync failed:', error);
    }
};

export const assignVolunteer = async (incidentId, volunteerId) => {
    if (!db) return;

    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
    const incidentDoc = await getDoc(incidentRef);
    
    if (!incidentDoc.exists()) return;

    const currentVolunteers = incidentDoc.data().assignedVolunteers || [];
    
    if (!currentVolunteers.includes(volunteerId)) {
        await updateDoc(incidentRef, {
            assignedVolunteers: [...currentVolunteers, volunteerId],
            status: IncidentStatus.ASSIGNED,
            updatedAt: serverTimestamp()
        });
    }
};

export const unassignVolunteer = async (incidentId, volunteerId) => {
    if (!db) return;

    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
    const incidentDoc = await getDoc(incidentRef);
    
    if (!incidentDoc.exists()) return;

    const currentVolunteers = incidentDoc.data().assignedVolunteers || [];
    const updatedVolunteers = currentVolunteers.filter(id => id !== volunteerId);

    await updateDoc(incidentRef, {
        assignedVolunteers: updatedVolunteers,
        status: updatedVolunteers.length === 0 ? IncidentStatus.REPORTED : IncidentStatus.ASSIGNED,
        updatedAt: serverTimestamp()
    });
};

export const assignResource = async (incidentId, resourceId, resourceType) => {
    if (!db) return;

    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
    const incidentDoc = await getDoc(incidentRef);
    
    if (!incidentDoc.exists()) return;

    const currentResources = incidentDoc.data().assignedResources || [];
    
    await updateDoc(incidentRef, {
        assignedResources: [...currentResources, { resourceId, resourceType, assignedAt: new Date() }],
        assignedTo: resourceId,
        status: IncidentStatus.ASSIGNED,
        updatedAt: serverTimestamp()
    });
};

export const getIncident = async (incidentId) => {
    if (!db) return null;

    const docSnap = await getDoc(doc(db, INCIDENTS_COLLECTION, incidentId));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const getActiveIncidents = async () => {
    if (!db) return [];

    const q = query(
        collection(db, INCIDENTS_COLLECTION),
        where('status', 'in', [
            IncidentStatus.REPORTED,
            IncidentStatus.ASSIGNED,
            IncidentStatus.IN_PROGRESS,
            IncidentStatus.ON_THE_WAY
        ]),
        orderBy('priorityScore', 'desc'),
        limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToIncidents = (callback, statusFilter = null) => {
    if (!db) {
        callback([]);
        return () => {};
    }

    // Simple query without composite index requirement
    const q = query(
        collection(db, INCIDENTS_COLLECTION),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        let incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Filter client-side if needed
        if (statusFilter) {
            incidents = incidents.filter(inc => inc.status === statusFilter);
        }
        
        // Sort by createdAt descending
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
        return () => {};
    }

    // Simple query without composite index requirement
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
                inc.status === IncidentStatus.REPORTED ||
                inc.status === IncidentStatus.ASSIGNED ||
                inc.status === IncidentStatus.IN_PROGRESS ||
                inc.status === IncidentStatus.ON_THE_WAY
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
        return () => {};
    }

    return onSnapshot(doc(db, INCIDENTS_COLLECTION, incidentId), (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    });
};

export const getIncidentStats = async () => {
    if (!db) {
        return {
            total: 0,
            active: 0,
            resolved: 0,
            critical: 0,
            avgResponseTime: 0
        };
    }

    const allIncidents = await getDocs(collection(db, INCIDENTS_COLLECTION));
    
    let total = 0;
    let active = 0;
    let resolved = 0;
    let critical = 0;
    let totalResponseTime = 0;
    let resolvedCount = 0;

    allIncidents.forEach(doc => {
        const data = doc.data();
        total++;
        
        if (data.status === IncidentStatus.RESOLVED) {
            resolved++;
            if (data.createdAt && data.resolvedAt) {
                const responseTime = data.resolvedAt.toMillis() - data.createdAt.toMillis();
                totalResponseTime += responseTime;
                resolvedCount++;
            }
        } else if (data.status !== IncidentStatus.CANCELLED) {
            active++;
        }
        
        if (data.severity === SeverityLevel.CRITICAL) {
            critical++;
        }
    });

    const avgResponseTime = resolvedCount > 0 
        ? Math.round(totalResponseTime / resolvedCount / 60000) 
        : 0;

    return {
        total,
        active,
        resolved,
        critical,
        avgResponseTime
    };
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const getNearbyIncidents = (incidents, userLat, userLng, radiusMiles = 10) => {
    return incidents.filter(incident => {
        if (!incident.location) return false;
        const lat = incident.location.latitude || incident.location._lat;
        const lng = incident.location.longitude || incident.location._long;
        const distance = calculateDistance(userLat, userLng, lat, lng);
        return distance <= radiusMiles;
    }).map(incident => {
        const lat = incident.location.latitude || incident.location._lat;
        const lng = incident.location.longitude || incident.location._long;
        return {
            ...incident,
            distance: calculateDistance(userLat, userLng, lat, lng)
        };
    }).sort((a, b) => a.distance - b.distance);
};
