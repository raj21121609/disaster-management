// Simple verification script for the protected backend
const BASE_URL = 'http://localhost:8080';

const testEndpoints = async () => {
    console.log('--- STARTING AUTH BACKEND VERIFICATION ---');

    // 1. Health Check (Public)
    try {
        const res = await fetch(`${BASE_URL}/`);
        const data = await res.json();
        console.log('[GET /] Health Check:', res.status === 200 ? 'PASS' : 'FAIL', data);
    } catch (e) {
        console.error('[GET /] Failed:', e.message);
    }

    // 2. Analyze Incident (Protected) - No Token
    try {
        const res = await fetch(`${BASE_URL}/analyze-incident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'fire' })
        });
        console.log('[POST /analyze-incident] No Token:', res.status === 401 ? 'PASS' : 'FAIL', `(Status: ${res.status})`);
    } catch (e) {
        console.error('Failed:', e.message);
    }

    // 3. Analyze Incident (Protected) - With Mock Token
    try {
        const payload = { type: 'fire', description: 'Large structure fire' };
        const res = await fetch(`${BASE_URL}/analyze-incident`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token'
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('[POST /analyze-incident] With Mock Token:', res.status === 200 ? 'PASS' : 'FAIL');
    } catch (e) {
        console.error('Failed:', e.message);
    }

    console.log('--- VERIFICATION COMPLETE ---');
};

testEndpoints();
