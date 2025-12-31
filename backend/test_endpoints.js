// Simple verification script for the backend
const BASE_URL = 'http://localhost:8080';

const testEndpoints = async () => {
    console.log('--- STARTING BACKEND VERIFICATION ---');

    // 1. Health Check
    try {
        const res = await fetch(`${BASE_URL}/`);
        const data = await res.json();
        console.log('[GET /] Health Check:', res.status === 200 ? 'PASS' : 'FAIL', data);
    } catch (e) {
        console.error('[GET /] Failed:', e.message);
    }

    // 2. Analyze Incident
    try {
        const payload = { type: 'fire', description: 'Large structure fire, people trapped inside' };
        const res = await fetch(`${BASE_URL}/analyze-incident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('[POST /analyze-incident] Fire Analysis:', res.status === 200 ? 'PASS' : 'FAIL');
        console.log('   -> Severity:', data.severity, '(Expected: critical/high)');
        console.log('   -> Score:', data.priorityScore);
    } catch (e) {
        console.error('[POST /analyze-incident] Failed:', e.message);
    }

    // 3. Update Status
    try {
        const payload = { incidentId: 'test-123', status: 'resolved' };
        const res = await fetch(`${BASE_URL}/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('[POST /update-status] Status Update:', res.status === 200 ? 'PASS' : 'FAIL', data);
    } catch (e) {
        console.error('[POST /update-status] Failed:', e.message);
    }

    console.log('--- VERIFICATION COMPLETE ---');
};

testEndpoints();
