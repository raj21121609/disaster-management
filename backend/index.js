const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

let db = null;
let auth = null;

try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        db = admin.firestore();
        auth = admin.auth();
        console.log('Firebase Admin initialized successfully.');
    } else if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID
        });
        db = admin.firestore();
        auth = admin.auth();
        console.log('Firebase Admin initialized with project ID.');
    } else {
        console.warn('WARNING: Firebase credentials not found. Running in MOCK mode.');
    }
} catch (error) {
    console.error('Firebase initialization failed:', error.message);
    console.warn('Running in MOCK mode.');
}

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Allow anonymous and mock tokens without verification
    if (token === 'anonymous' || token === 'mock-token') {
        req.user = { uid: 'anonymous', email: 'anonymous@example.com' };
        return next();
    }

    // If Firebase Auth is not configured, allow any token
    if (!auth) {
        req.user = { uid: 'anonymous', email: 'anonymous@example.com' };
        return next();
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        // Allow through with anonymous user on verification failure (for development)
        if (process.env.NODE_ENV === 'development') {
            req.user = { uid: 'anonymous', email: 'anonymous@example.com' };
            return next();
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !auth) {
        req.user = null;
        return next();
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
    } catch (error) {
        req.user = null;
    }
    next();
};

const analyzeSeverity = (type, description) => {
    const text = (description || '').toLowerCase();
    const typeKey = (type || '').toLowerCase();

    const criticalKeywords = [
        'fire', 'gun', 'shooter', 'cardiac', 'stroke', 'explosion',
        'trapped', 'unconscious', 'collapse', 'not breathing', 'dying',
        'multiple casualties', 'building collapse', 'gas leak', 'bomb'
    ];

    const highKeywords = [
        'accident', 'crash', 'blood', 'injury', 'broken', 'breathing',
        'severe', 'felony', 'assault', 'robbery', 'drowning', 'choking',
        'chest pain', 'fall', 'hit by car'
    ];

    const mediumKeywords = [
        'fight', 'dispute', 'minor injury', 'theft', 'vandalism',
        'smoke', 'alarm', 'suspicious'
    ];

    let baseScore = 25;
    let severity = 'low';

    if (typeKey.includes('fire')) baseScore = 65;
    else if (typeKey.includes('medical')) baseScore = 55;
    else if (typeKey.includes('accident')) baseScore = 50;
    else if (typeKey.includes('police')) baseScore = 45;
    else if (typeKey.includes('flood')) baseScore = 40;

    const criticalHit = criticalKeywords.some(w => text.includes(w));
    const highHit = highKeywords.some(w => text.includes(w));
    const mediumHit = mediumKeywords.some(w => text.includes(w));

    if (criticalHit) {
        baseScore = 95;
        severity = 'critical';
    } else if (highHit || baseScore >= 60) {
        baseScore = Math.max(baseScore, 75);
        severity = 'high';
    } else if (mediumHit || baseScore >= 40) {
        baseScore = Math.max(baseScore, 50);
        severity = 'medium';
    }

    const priorityScore = Math.min(100, Math.max(0, baseScore));

    return {
        severity,
        priorityScore,
        analysis: {
            type: typeKey,
            criticalMatch: criticalHit,
            highMatch: highHit,
            baseScore: baseScore
        }
    };
};

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'CRISIS.ONE Backend Running',
        version: '1.0.0',
        mode: db ? 'live' : 'mock',
        endpoints: [
            'POST /analyze-incident',
            'POST /update-status',
            'GET /stats',
            'POST /dispatch',
            'GET /health'
        ]
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        firebase: db ? 'connected' : 'disconnected'
    });
});

app.post('/analyze-incident', optionalAuth, (req, res) => {
    try {
        const { type, description } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'Incident type is required' });
        }

        const analysis = analyzeSeverity(type, description);

        console.log(`[ANALYZE] Type: ${type} -> ${analysis.severity} (score: ${analysis.priorityScore})`);

        res.status(200).json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

app.post('/update-status', authenticateToken, async (req, res) => {
    try {
        const { incidentId, status, notes } = req.body;

        if (!incidentId || !status) {
            return res.status(400).json({ error: 'incidentId and status are required' });
        }

        const validStatuses = ['reported', 'assigned', 'in_progress', 'on_the_way', 'resolved', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        if (db) {
            const updateData = {
                status: status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: req.user?.uid || 'system'
            };

            if (status === 'resolved') {
                updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
                updateData.resolvedBy = req.user?.uid;
            }

            if (notes) {
                updateData.notes = admin.firestore.FieldValue.arrayUnion({
                    text: notes,
                    author: req.user?.uid || 'system',
                    timestamp: new Date().toISOString()
                });
            }

            await db.collection('incidents').doc(incidentId).update(updateData);
            console.log(`[UPDATE] Incident ${incidentId} -> ${status}`);
        } else {
            console.log(`[MOCK] Updated incident ${incidentId} to ${status}`);
        }

        res.status(200).json({
            success: true,
            incidentId,
            status,
            updatedBy: req.user?.uid
        });
    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

app.post('/incidents', authenticateToken, async (req, res) => {
    try {
        const { type, severity, description, latitude, longitude, address, contactPhone, priorityScore, aiSeverity } = req.body;

        if (!type || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing required fields: type, latitude, longitude' });
        }

        const newIncident = {
            type,
            severity: severity || 'medium',
            description: description || '',
            location: {
                latitude,
                longitude,
                address: address || ''
            },
            contactPhone: contactPhone || '',
            status: 'reported',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user?.uid || 'anonymous',
            priorityScore: priorityScore || 0,
            aiSeverity: aiSeverity || severity || 'medium',
            updates: []
        };

        let incidentId;

        if (db) {
            const docRef = await db.collection('incidents').add(newIncident);
            incidentId = docRef.id;
            console.log(`[NEW INCIDENT] ID: ${incidentId}, Type: ${type}, Severity: ${newIncident.severity}`);
        } else {
            incidentId = 'mock-incident-' + Date.now();
            console.log(`[MOCK] Created incident ${incidentId}`);
        }

        res.status(201).json({
            success: true,
            id: incidentId,
            ...newIncident,
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Create incident failed:', error);
        res.status(500).json({ error: 'Failed to create incident', details: error.message });
    }
});

app.post('/dispatch', authenticateToken, async (req, res) => {
    try {
        const { incidentId, resourceId, resourceType } = req.body;

        if (!incidentId || !resourceId) {
            return res.status(400).json({ error: 'incidentId and resourceId are required' });
        }

        if (db) {
            const incidentRef = db.collection('incidents').doc(incidentId);

            await incidentRef.update({
                status: 'assigned',
                assignedTo: resourceId,
                assignedResources: admin.firestore.FieldValue.arrayUnion({
                    resourceId,
                    resourceType: resourceType || 'unknown',
                    assignedAt: new Date().toISOString(),
                    assignedBy: req.user?.uid
                }),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`[DISPATCH] Resource ${resourceId} assigned to incident ${incidentId}`);
        } else {
            console.log(`[MOCK] Dispatched ${resourceId} to incident ${incidentId}`);
        }

        res.status(200).json({
            success: true,
            incidentId,
            resourceId,
            dispatchedBy: req.user?.uid
        });
    } catch (error) {
        console.error('Dispatch failed:', error);
        res.status(500).json({ error: 'Dispatch failed', details: error.message });
    }
});

// RESTful endpoint for status updates (used by frontend incidentService)
app.put('/incidents/:incidentId/status', authenticateToken, async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { status, userId } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }

        const validStatuses = ['reported', 'assigned', 'in_progress', 'on_the_way', 'resolved', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        if (db) {
            const updateData = {
                status: status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: userId || req.user?.uid || 'system'
            };

            if (status === 'resolved') {
                updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
                updateData.resolvedBy = userId || req.user?.uid;
            }

            await db.collection('incidents').doc(incidentId).update(updateData);
            console.log(`[UPDATE] Incident ${incidentId} -> ${status}`);
        }

        res.status(200).json({
            success: true,
            incidentId,
            status,
            updatedBy: req.user?.uid
        });
    } catch (error) {
        console.error('Update status failed:', error);
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

// Assign volunteer to incident
app.post('/incidents/:incidentId/volunteers', authenticateToken, async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { volunteerId } = req.body;

        if (!volunteerId) {
            return res.status(400).json({ error: 'volunteerId is required' });
        }

        if (db) {
            await db.collection('incidents').doc(incidentId).update({
                assignedVolunteers: admin.firestore.FieldValue.arrayUnion(volunteerId),
                status: 'assigned',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[VOLUNTEER] ${volunteerId} assigned to incident ${incidentId}`);
        }

        res.status(200).json({
            success: true,
            incidentId,
            volunteerId
        });
    } catch (error) {
        console.error('Assign volunteer failed:', error);
        res.status(500).json({ error: 'Assignment failed', details: error.message });
    }
});

// Remove volunteer from incident
app.delete('/incidents/:incidentId/volunteers/:volunteerId', authenticateToken, async (req, res) => {
    try {
        const { incidentId, volunteerId } = req.params;

        if (db) {
            await db.collection('incidents').doc(incidentId).update({
                assignedVolunteers: admin.firestore.FieldValue.arrayRemove(volunteerId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[VOLUNTEER] ${volunteerId} removed from incident ${incidentId}`);
        }

        res.status(200).json({
            success: true,
            incidentId,
            volunteerId
        });
    } catch (error) {
        console.error('Remove volunteer failed:', error);
        res.status(500).json({ error: 'Removal failed', details: error.message });
    }
});

// Assign resource to incident
app.post('/incidents/:incidentId/resources', authenticateToken, async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { resourceId, resourceType } = req.body;

        if (!resourceId) {
            return res.status(400).json({ error: 'resourceId is required' });
        }

        if (db) {
            await db.collection('incidents').doc(incidentId).update({
                status: 'assigned',
                assignedResources: admin.firestore.FieldValue.arrayUnion({
                    resourceId,
                    resourceType: resourceType || 'unknown',
                    assignedAt: new Date().toISOString(),
                    assignedBy: req.user?.uid
                }),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[RESOURCE] ${resourceId} assigned to incident ${incidentId}`);
        }

        res.status(200).json({
            success: true,
            incidentId,
            resourceId,
            resourceType
        });
    } catch (error) {
        console.error('Assign resource failed:', error);
        res.status(500).json({ error: 'Assignment failed', details: error.message });
    }
});

app.get('/stats', optionalAuth, async (req, res) => {
    try {
        if (!db) {
            return res.status(200).json({
                total: 0,
                active: 0,
                resolved: 0,
                critical: 0,
                avgResponseTime: 0,
                mode: 'mock'
            });
        }

        const incidentsSnapshot = await db.collection('incidents').get();

        let total = 0;
        let active = 0;
        let resolved = 0;
        let critical = 0;
        let totalResponseTime = 0;
        let resolvedCount = 0;

        incidentsSnapshot.forEach(doc => {
            const data = doc.data();
            total++;

            if (data.status === 'resolved') {
                resolved++;
                if (data.createdAt && data.resolvedAt) {
                    const responseTime = data.resolvedAt.toMillis() - data.createdAt.toMillis();
                    totalResponseTime += responseTime;
                    resolvedCount++;
                }
            } else if (data.status !== 'cancelled') {
                active++;
            }

            if (data.severity === 'critical' && data.status !== 'resolved') {
                critical++;
            }
        });

        const avgResponseTime = resolvedCount > 0
            ? Math.round(totalResponseTime / resolvedCount / 60000)
            : 0;

        res.status(200).json({
            total,
            active,
            resolved,
            critical,
            avgResponseTime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
    }
});

app.post('/predict-resources', optionalAuth, async (req, res) => {
    try {
        const { type, severity, description, location } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'Incident type is required' });
        }

        const prediction = predictResources(type, severity || 'medium', description || '', location || '');

        console.log(`[PREDICT] Type: ${type}, Severity: ${severity} -> ${prediction.resources.length} resources`);

        res.status(200).json(prediction);
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Prediction failed', details: error.message });
    }
});

function predictResources(type, severity, description, location) {
    const text = description.toLowerCase();

    const prediction = {
        resources: [],
        estimatedResponseTime: 0,
        confidence: 0,
        recommendations: [],
        riskAssessment: '',
        requiredPersonnel: 0,
        supplies: [],
        aiModel: 'CRISIS.ONE Rule-Based Engine v1.0'
    };

    switch (type) {
        case 'medical':
            prediction.resources.push({
                type: 'Ambulance',
                quantity: severity === 'critical' ? 2 : 1,
                icon: '🚑',
                priority: 'high'
            });
            if (severity === 'critical' || text.includes('cardiac') || text.includes('stroke')) {
                prediction.resources.push({
                    type: 'Advanced Life Support Unit',
                    quantity: 1,
                    icon: '🏥',
                    priority: 'critical'
                });
                prediction.requiredPersonnel = 6;
                prediction.supplies = [
                    { name: 'Defibrillator', quantity: 1 },
                    { name: 'IV Kit', quantity: 2 },
                    { name: 'Oxygen', quantity: 2 }
                ];
            } else {
                prediction.requiredPersonnel = 3;
                prediction.supplies = [
                    { name: 'First Aid Kit', quantity: 2 },
                    { name: 'Stretcher', quantity: 1 }
                ];
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 4 : 7;
            prediction.recommendations = [
                'Dispatch nearest available unit',
                'Alert receiving hospital',
                'Prepare trauma bay if critical'
            ];
            break;

        case 'fire':
            prediction.resources.push({
                type: 'Fire Engine',
                quantity: severity === 'critical' ? 3 : 2,
                icon: '🚒',
                priority: 'critical'
            });
            prediction.resources.push({
                type: 'Ladder Truck',
                quantity: 1,
                icon: '🪜',
                priority: 'high'
            });
            if (severity === 'critical' || text.includes('trapped')) {
                prediction.resources.push({
                    type: 'Rescue Squad',
                    quantity: 1,
                    icon: '🦺',
                    priority: 'critical'
                });
                prediction.resources.push({
                    type: 'Ambulance',
                    quantity: 2,
                    icon: '🚑',
                    priority: 'high'
                });
                prediction.requiredPersonnel = 20;
            } else {
                prediction.requiredPersonnel = 12;
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 5 : 8;
            prediction.supplies = [
                { name: 'Fire Hose', quantity: 4 },
                { name: 'Breathing Apparatus', quantity: 6 },
                { name: 'Thermal Camera', quantity: 2 }
            ];
            prediction.recommendations = [
                'Establish incident command',
                'Notify utility companies',
                'Stage EMS for standby',
                'Request additional units if structure fire'
            ];
            break;

        case 'accident':
            prediction.resources.push({
                type: 'Police Unit',
                quantity: 2,
                icon: '🚔',
                priority: 'high'
            });
            prediction.resources.push({
                type: 'Ambulance',
                quantity: severity === 'critical' ? 2 : 1,
                icon: '🚑',
                priority: 'high'
            });
            if (text.includes('trapped') || text.includes('extrication')) {
                prediction.resources.push({
                    type: 'Fire/Rescue',
                    quantity: 1,
                    icon: '🚒',
                    priority: 'critical'
                });
                prediction.requiredPersonnel = 10;
            } else {
                prediction.requiredPersonnel = 6;
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 5 : 9;
            prediction.supplies = [
                { name: 'Traffic Cones', quantity: 10 },
                { name: 'First Aid Kit', quantity: 2 },
                { name: 'Flares', quantity: 6 }
            ];
            prediction.recommendations = [
                'Secure accident scene',
                'Request tow service',
                'Document scene for investigation'
            ];
            break;

        case 'flood':
            prediction.resources.push({
                type: 'Water Rescue Team',
                quantity: severity === 'critical' ? 2 : 1,
                icon: '🚤',
                priority: 'critical'
            });
            prediction.resources.push({
                type: 'Evacuation Bus',
                quantity: 1,
                icon: '🚌',
                priority: 'high'
            });
            prediction.requiredPersonnel = severity === 'critical' ? 15 : 8;
            prediction.estimatedResponseTime = 10;
            prediction.supplies = [
                { name: 'Life Jackets', quantity: 20 },
                { name: 'Rope/Throw Bag', quantity: 10 },
                { name: 'Emergency Blankets', quantity: 30 }
            ];
            prediction.recommendations = [
                'Activate flood emergency protocol',
                'Coordinate with Red Cross',
                'Monitor water levels',
                'Prepare emergency shelter'
            ];
            break;

        case 'police':
            prediction.resources.push({
                type: 'Police Unit',
                quantity: severity === 'critical' ? 4 : 2,
                icon: '🚔',
                priority: 'critical'
            });
            if (severity === 'critical' || text.includes('weapon') || text.includes('armed')) {
                prediction.resources.push({
                    type: 'SWAT/Tactical Unit',
                    quantity: 1,
                    icon: '🎯',
                    priority: 'critical'
                });
                prediction.requiredPersonnel = 20;
            } else {
                prediction.requiredPersonnel = 4;
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 3 : 6;
            prediction.supplies = [
                { name: 'Body Armor', quantity: 4 },
                { name: 'First Aid Kit', quantity: 2 }
            ];
            prediction.recommendations = [
                'Establish perimeter',
                'Gather witness information',
                'Request backup if armed suspect'
            ];
            break;

        default:
            prediction.resources.push({
                type: 'First Responder',
                quantity: 1,
                icon: '🦺',
                priority: 'medium'
            });
            prediction.requiredPersonnel = 2;
            prediction.estimatedResponseTime = 10;
            prediction.supplies = [{ name: 'First Aid Kit', quantity: 1 }];
            prediction.recommendations = ['Assess situation on arrival'];
    }

    const severityMultiplier = { critical: 1.0, high: 0.85, medium: 0.7, low: 0.5 };
    prediction.confidence = Math.round((severityMultiplier[severity] || 0.7) * 100);

    if (severity === 'critical') {
        prediction.riskAssessment = 'HIGH RISK - Immediate action required. Multiple resources recommended.';
    } else if (severity === 'high') {
        prediction.riskAssessment = 'ELEVATED RISK - Priority response needed. Monitor for escalation.';
    } else if (severity === 'medium') {
        prediction.riskAssessment = 'MODERATE RISK - Standard response protocol. Assess on arrival.';
    } else {
        prediction.riskAssessment = 'LOW RISK - Routine response. Single unit may suffice.';
    }

    return prediction;
}

app.post('/alert', authenticateToken, async (req, res) => {
    try {
        const { incidentId, message, severity = 'high' } = req.body;

        if (!incidentId || !message) {
            return res.status(400).json({ error: 'incidentId and message are required' });
        }

        if (db) {
            await db.collection('alerts').add({
                incidentId,
                message,
                severity,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: req.user?.uid,
                acknowledged: false
            });

            console.log(`[ALERT] Created alert for incident ${incidentId}`);
        }

        res.status(200).json({ success: true, message: 'Alert created' });
    } catch (error) {
        console.error('Alert creation failed:', error);
        res.status(500).json({ error: 'Alert creation failed', details: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`\n🚨 CRISIS.ONE Backend`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Mode: ${db ? 'LIVE (Firebase connected)' : 'MOCK'}`);
    console.log(`   Ready to serve requests\n`);
});
