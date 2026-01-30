/**
 * localSeverityAI.js
 * Rule-based offline severity estimation
 * 
 * IMPORTANT: This is a PRELIMINARY ESTIMATE only.
 * Offline AI is advisory and NEVER overrides server-side AI.
 * Final validation happens on the backend.
 */

// Severity levels (matches backend constants)
const SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
};

// Keyword patterns for severity detection
const CRITICAL_KEYWORDS = [
    'explosion', 'bomb', 'terrorist', 'shooting', 'mass casualty',
    'building collapse', 'trapped', 'multiple fatalities', 'nuclear',
    'chemical spill', 'gas leak', 'hostage', 'active shooter',
    'major earthquake', 'tsunami', 'tornado',
];

const HIGH_KEYWORDS = [
    'fire', 'burning', 'flood', 'drowning', 'unconscious',
    'heart attack', 'stroke', 'severe bleeding', 'blood',
    'car accident', 'crash', 'collision', 'electrocution',
    'poisoning', 'overdose', 'assault', 'violence',
    'child missing', 'kidnapping', 'armed',
];

const MEDIUM_KEYWORDS = [
    'injury', 'injured', 'hurt', 'pain', 'broken',
    'theft', 'robbery', 'burglary', 'vandalism',
    'power outage', 'water leak', 'minor accident',
    'medical', 'ambulance', 'emergency',
];

// Incident type severity weights
const TYPE_SEVERITY = {
    'fire': HIGH_KEYWORDS,
    'medical': MEDIUM_KEYWORDS,
    'accident': MEDIUM_KEYWORDS,
    'flood': HIGH_KEYWORDS,
    'police': MEDIUM_KEYWORDS,
    'other': MEDIUM_KEYWORDS,
};

/**
 * Analyze text for severity keywords
 * @param {string} text - Text to analyze
 * @param {string[]} keywords - Keywords to match
 * @returns {number} Number of matches
 */
function countKeywordMatches(text, keywords) {
    if (!text) return 0;
    const lowerText = text.toLowerCase();
    return keywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
}

/**
 * Run local rule-based severity analysis
 * @param {Object} incidentData - Incident data
 * @returns {Object} Offline AI result
 * 
 * NOTE: This is a preliminary offline estimate.
 * Final severity is determined by server-side AI.
 */
export function analyzeLocalSeverity(incidentData) {
    const { description = '', type = 'other', severity: userSeverity } = incidentData;

    // Count keyword matches
    const criticalMatches = countKeywordMatches(description, CRITICAL_KEYWORDS);
    const highMatches = countKeywordMatches(description, HIGH_KEYWORDS);
    const mediumMatches = countKeywordMatches(description, MEDIUM_KEYWORDS);

    // Calculate base score
    let score = 0;
    score += criticalMatches * 30;
    score += highMatches * 15;
    score += mediumMatches * 5;

    // Boost based on incident type
    if (type === 'fire' || type === 'flood') {
        score += 20;
    } else if (type === 'medical' || type === 'accident') {
        score += 10;
    }

    // User-reported severity boost
    if (userSeverity === 'critical') {
        score += 25;
    } else if (userSeverity === 'high') {
        score += 15;
    }

    // Normalize score (0-100)
    score = Math.min(100, Math.max(0, score));

    // Determine severity level
    let estimatedSeverity;
    if (score >= 70 || criticalMatches > 0) {
        estimatedSeverity = SEVERITY.CRITICAL;
    } else if (score >= 40 || highMatches > 0) {
        estimatedSeverity = SEVERITY.HIGH;
    } else if (score >= 20) {
        estimatedSeverity = SEVERITY.MEDIUM;
    } else {
        estimatedSeverity = SEVERITY.LOW;
    }

    // Keywords found (for transparency)
    const matchedKeywords = [
        ...CRITICAL_KEYWORDS.filter(kw => description.toLowerCase().includes(kw)),
        ...HIGH_KEYWORDS.filter(kw => description.toLowerCase().includes(kw)),
    ].slice(0, 5); // Top 5 matches

    return {
        severity: estimatedSeverity,
        score: score,
        confidence: score > 50 ? 'high' : score > 25 ? 'medium' : 'low',
        matchedKeywords: matchedKeywords,
        // Clear labeling that this is offline/preliminary
        isOfflineEstimate: true,
        disclaimer: 'Preliminary Offline AI Estimate. Final validation happens server-side.',
        analyzedAt: new Date().toISOString(),
    };
}

/**
 * Get severity display color
 * @param {string} severity - Severity level
 * @returns {string} CSS color
 */
export function getSeverityColor(severity) {
    switch (severity) {
        case SEVERITY.CRITICAL:
            return '#ef4444'; // Red
        case SEVERITY.HIGH:
            return '#f59e0b'; // Amber
        case SEVERITY.MEDIUM:
            return '#3b82f6'; // Blue
        case SEVERITY.LOW:
            return '#10b981'; // Green
        default:
            return '#64748b'; // Gray
    }
}

export default {
    analyzeLocalSeverity,
    getSeverityColor,
    SEVERITY,
};
