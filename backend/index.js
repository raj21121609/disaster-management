const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

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

    if (token === 'anonymous' || token === 'mock-token') {
        req.user = { uid: 'anonymous', email: 'anonymous@example.com' };
        return next();
    }

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

/* ============================
   1️⃣ LOCAL OFFLINE SEVERITY (RULE-BASED)
============================ */
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

/* ============================
   2️⃣ PREDICT RESOURCES (RULE-BASED)
============================ */
function predictResources(type, severity, description, location) {
    const text = (description || '').toLowerCase();
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
            prediction.resources.push({ type: 'Ambulance', quantity: severity === 'critical' ? 2 : 1, icon: '🚑', priority: 'high' });
            if (severity === 'critical' || text.includes('cardiac') || text.includes('stroke')) {
                prediction.resources.push({ type: 'Advanced Life Support Unit', quantity: 1, icon: '🏥', priority: 'critical' });
                prediction.requiredPersonnel = 6;
                prediction.supplies = [{ name: 'Defibrillator', quantity: 1 }, { name: 'IV Kit', quantity: 2 }, { name: 'Oxygen', quantity: 2 }];
            } else {
                prediction.requiredPersonnel = 3;
                prediction.supplies = [{ name: 'First Aid Kit', quantity: 2 }, { name: 'Stretcher', quantity: 1 }];
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 4 : 7;
            prediction.recommendations = ['Dispatch nearest available unit', 'Alert receiving hospital', 'Prepare trauma bay if critical'];
            break;

        case 'fire':
            prediction.resources.push({ type: 'Fire Engine', quantity: severity === 'critical' ? 3 : 2, icon: '🚒', priority: 'critical' });
            prediction.resources.push({ type: 'Ladder Truck', quantity: 1, icon: '🪜', priority: 'high' });
            if (severity === 'critical' || text.includes('trapped')) {
                prediction.resources.push({ type: 'Rescue Squad', quantity: 1, icon: '🦺', priority: 'critical' });
                prediction.resources.push({ type: 'Ambulance', quantity: 2, icon: '🚑', priority: 'high' });
                prediction.requiredPersonnel = 20;
            } else {
                prediction.requiredPersonnel = 12;
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 5 : 8;
            prediction.supplies = [{ name: 'Fire Hose', quantity: 4 }, { name: 'Breathing Apparatus', quantity: 6 }, { name: 'Thermal Camera', quantity: 2 }];
            prediction.recommendations = ['Establish incident command', 'Notify utility companies', 'Stage EMS for standby', 'Request additional units if structure fire'];
            break;

        case 'accident':
            prediction.resources.push({ type: 'Police Unit', quantity: 2, icon: '🚔', priority: 'high' });
            prediction.resources.push({ type: 'Ambulance', quantity: severity === 'critical' ? 2 : 1, icon: '🚑', priority: 'high' });
            if (text.includes('trapped') || text.includes('extrication')) {
                prediction.resources.push({ type: 'Fire/Rescue', quantity: 1, icon: '🚒', priority: 'critical' });
                prediction.requiredPersonnel = 10;
            } else {
                prediction.requiredPersonnel = 6;
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 5 : 9;
            prediction.supplies = [{ name: 'Traffic Cones', quantity: 10 }, { name: 'First Aid Kit', quantity: 2 }, { name: 'Flares', quantity: 6 }];
            prediction.recommendations = ['Secure accident scene', 'Request tow service', 'Document scene for investigation'];
            break;

        case 'flood':
            prediction.resources.push({ type: 'Water Rescue Team', quantity: severity === 'critical' ? 2 : 1, icon: '🚤', priority: 'critical' });
            prediction.resources.push({ type: 'Evacuation Bus', quantity: 1, icon: '🚌', priority: 'high' });
            prediction.requiredPersonnel = severity === 'critical' ? 15 : 8;
            prediction.estimatedResponseTime = 10;
            prediction.supplies = [{ name: 'Life Jackets', quantity: 20 }, { name: 'Rope/Throw Bag', quantity: 10 }, { name: 'Emergency Blankets', quantity: 30 }];
            prediction.recommendations = ['Activate flood emergency protocol', 'Coordinate with Red Cross', 'Monitor water levels', 'Prepare emergency shelter'];
            break;

        case 'police':
            prediction.resources.push({ type: 'Police Unit', quantity: severity === 'critical' ? 4 : 2, icon: '🚔', priority: 'critical' });
            if (severity === 'critical' || text.includes('weapon') || text.includes('armed')) {
                prediction.resources.push({ type: 'SWAT/Tactical Unit', quantity: 1, icon: '🎯', priority: 'critical' });
                prediction.requiredPersonnel = 20;
            } else {
                prediction.requiredPersonnel = 4;
            }
            prediction.estimatedResponseTime = severity === 'critical' ? 3 : 6;
            prediction.supplies = [{ name: 'Body Armor', quantity: 4 }, { name: 'First Aid Kit', quantity: 2 }];
            prediction.recommendations = ['Establish perimeter', 'Gather witness information', 'Request backup if armed suspect'];
            break;

        default:
            prediction.resources.push({ type: 'First Responder', quantity: 1, icon: '🦺', priority: 'medium' });
            prediction.requiredPersonnel = 2;
            prediction.estimatedResponseTime = 10;
            prediction.supplies = [{ name: 'First Aid Kit', quantity: 1 }];
            prediction.recommendations = ['Assess situation on arrival'];
    }

    const severityMultiplier = { critical: 1.0, high: 0.85, medium: 0.7, low: 0.5 };
    prediction.confidence = Math.round((severityMultiplier[severity] || 0.7) * 100);

    if (severity === 'critical') prediction.riskAssessment = 'HIGH RISK - Immediate action required. Multiple resources recommended.';
    else if (severity === 'high') prediction.riskAssessment = 'ELEVATED RISK - Priority response needed. Monitor for escalation.';
    else if (severity === 'medium') prediction.riskAssessment = 'MODERATE RISK - Standard response protocol. Assess on arrival.';
    else prediction.riskAssessment = 'LOW RISK - Routine response. Single unit may suffice.';

    return prediction;
}

/* ============================
   3️⃣ HYBRID DECISION ENGINE
============================ */
function decisionEngine(visualAnalysis, textDescription, type) {
    // 1. Text Analysis
    let textAnalysis = analyzeSeverity(type, textDescription);
    let severity = textAnalysis.severity;
    let priorityScore = textAnalysis.priorityScore;

    // 2. Image Signals Augmentation
    if (visualAnalysis && visualAnalysis.confidence > 0.7) {
        const label = (visualAnalysis.label || '').toLowerCase();

        // Critical visual cues
        if (label.includes('fire') || label.includes('explosion') || label.includes('smoke')) {
            if (severity !== 'critical') {
                severity = 'high';
                priorityScore = Math.max(priorityScore, 85);
            }
            if (label.includes('fire') && (textDescription.includes('large') || textDescription.includes('trapped'))) {
                severity = 'critical';
                priorityScore = 95;
            }
        }

        // Accident cues
        if (label.includes('crash') || label.includes('wreck') || label.includes('vehicle')) {
            if (severity === 'low') {
                severity = 'medium';
                priorityScore = Math.max(priorityScore, 45);
            }
        }
    }

    // 3. Resource Prediction
    const resourcePlan = predictResources(type, severity, textDescription, '');

    return {
        incidentType: type,
        textAnalysis,
        visualAnalysis,
        severity,
        priorityScore,
        resources: resourcePlan.resources,
        requiredPersonnel: resourcePlan.requiredPersonnel,
        estimatedResponseTime: resourcePlan.estimatedResponseTime,
        recommendations: resourcePlan.recommendations,
        confidence: resourcePlan.confidence
    };
}

/* ============================
   4️⃣ GEMINI EXPLAINABILITY
============================ */
async function explainWithGemini(decision) {
    if (!process.env.GEMINI_API_KEY) return "LLM explanation disabled (No API Key)";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an emergency response decision-support assistant.

Severity and resources are already decided by a deterministic system. Do NOT change them.

Incident type: ${decision.incidentType}
Severity: ${decision.severity} (Score: ${decision.priorityScore})
Visual Intel: ${decision.visualAnalysis ? decision.visualAnalysis.label : 'None'}
Resources Deployed:
${JSON.stringify(decision.resources, null, 2)}

Explain:
1. Why these resources are required based on the severity and type.
2. What risks may escalate if delayed (Risk Assessment).
3. Safety precautions for responders for this specific incident type.
Keep it concise, tactical, and authoritative. Max 3-4 sentences per point.
`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Error:", error.message);
        return "LLM Explanation unavailable at this time.";
    }
}

// Configure Multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* ============================
   ENDPOINTS
============================ */

// 1. Image Analysis Proxy
app.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });

        console.log(`[VISION] Analyzing image: ${req.file.originalname}`);

        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

        const visionUrl = 'http://localhost:9000/analyze-image';
        const response = await axios.post(visionUrl, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Vision Service Error:', error.message);
        res.status(502).json({ error: 'Vision analysis service unavailable', visual_label: 'unknown', confidence: 0 });
    }
});

// 2. Hybrid Incident Analysis
app.post('/analyze-incident', optionalAuth, async (req, res) => {
    try {
        const { type, description, visualAnalysis, isOffline } = req.body;

        if (!type) return res.status(400).json({ error: 'Incident type is required' });

        // Offline Fallback
        if (isOffline) {
            const offlineAI = analyzeSeverity(type, description);
            return res.json({
                status: "QUEUED_OFFLINE",
                ...offlineAI,
                message: "Queued · Will send when online"
            });
        }

        // Online Hybrid Pipeline
        const decision = decisionEngine(visualAnalysis, description, type);

        let explanation = "LLM unavailable";
        try {
            explanation = await explainWithGemini(decision);
        } catch (e) {
            console.error("Gemini error:", e.message);
        }

        console.log(`[HYBRID AI] ${type} (${decision.severity}) - LLM Explained`);

        res.status(200).json({
            ...decision,
            llmExplanation: explanation,
            aiMode: "hybrid-human-in-the-loop",
            disclaimer: "AI assists. Humans decide."
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

// 3. Health & Basics
app.get('/', (req, res) => res.status(200).json({ status: 'CRISIS.ONE Backend Running', version: '2.0-HybridAI' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() }));

// 4. Update Status
app.post('/update-status', authenticateToken, async (req, res) => {
    try {
        const { incidentId, status, notes } = req.body;
        if (db) {
            await db.collection('incidents').doc(incidentId).update({
                status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                notes: notes ? admin.firestore.FieldValue.arrayUnion({ text: notes, author: req.user?.uid, timestamp: new Date().toISOString() }) : undefined
            });
        }
        res.status(200).json({ success: true, incidentId, status });
    } catch (error) { res.status(500).json({ error: 'Update failed' }); }
});

// 5. Create Incident
app.post('/incidents', authenticateToken, async (req, res) => {
    try {
        const { type, severity, description, latitude, longitude, address, contactPhone, priorityScore, aiSeverity, llmExplanation } = req.body;

        const newIncident = {
            type, severity: severity || 'medium', description: description || '',
            location: { latitude, longitude, address: address || '' },
            contactPhone: contactPhone || '', status: 'reported',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user?.uid || 'anonymous',
            priorityScore: priorityScore || 0,
            aiSeverity: aiSeverity || severity || 'medium',
            llmExplanation: llmExplanation || '',
            updates: []
        };

        let incidentId = 'mock-' + Date.now();
        if (db) {
            const docRef = await db.collection('incidents').add(newIncident);
            incidentId = docRef.id;
        }
        res.status(201).json({ success: true, id: incidentId, ...newIncident });
    } catch (error) { res.status(500).json({ error: 'Failed to create incident' }); }
});

// 6. Predict Resources (Legacy/Direct access)
app.post('/predict-resources', optionalAuth, async (req, res) => {
    const { type, severity, description } = req.body;
    res.json(predictResources(type, severity || 'medium', description || ''));
});

// 7. Stats
app.get('/stats', optionalAuth, async (req, res) => {
    if (!db) return res.json({ total: 0, mode: 'mock' });
    const snap = await db.collection('incidents').get();
    res.json({ total: snap.size, timestamp: new Date().toISOString() });
});

// Alert endpoint
app.post('/alert', authenticateToken, async (req, res) => {
    const { incidentId, message, severity } = req.body;
    if (db) await db.collection('alerts').add({ incidentId, message, severity, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`\n🚨 CRISIS.ONE Backend (Hybrid AI Pipeline)`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Mode: ${db ? 'LIVE (Firebase connected)' : 'MOCK'}`);
    console.log(`   Ready to serve requests\n`);
});
