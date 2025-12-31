/**
 * AI Explainability Service
 * Provides transparent explanations for AI severity decisions
 * Makes the "black box" fully transparent for judges and users
 */

// Keyword dictionaries with explanations
const KEYWORD_RULES = {
    critical: {
        keywords: [
            { word: 'fire', reason: 'Active fire emergency - life threatening' },
            { word: 'gun', reason: 'Firearm involved - extreme danger' },
            { word: 'shooter', reason: 'Active shooter situation' },
            { word: 'cardiac', reason: 'Cardiac emergency - time critical' },
            { word: 'stroke', reason: 'Stroke symptoms - brain damage risk' },
            { word: 'explosion', reason: 'Explosion detected - mass casualty potential' },
            { word: 'trapped', reason: 'Person trapped - rescue required' },
            { word: 'unconscious', reason: 'Unresponsive victim - immediate care needed' },
            { word: 'collapse', reason: 'Structure/person collapse - entrapment risk' },
            { word: 'not breathing', reason: 'Respiratory failure - CPR needed' },
            { word: 'dying', reason: 'Life-threatening emergency' },
            { word: 'bomb', reason: 'Explosive device - evacuation required' },
            { word: 'gas leak', reason: 'Hazardous gas - explosion/toxicity risk' },
            { word: 'multiple casualties', reason: 'Mass casualty incident' },
            { word: 'building collapse', reason: 'Structural failure - search and rescue' }
        ],
        baseScore: 95,
        color: '#ef4444'
    },
    high: {
        keywords: [
            { word: 'accident', reason: 'Vehicular/industrial accident' },
            { word: 'crash', reason: 'Vehicle collision detected' },
            { word: 'blood', reason: 'Active bleeding - trauma' },
            { word: 'injury', reason: 'Physical injury reported' },
            { word: 'broken', reason: 'Fracture/structural damage' },
            { word: 'breathing', reason: 'Respiratory distress' },
            { word: 'severe', reason: 'Severity modifier detected' },
            { word: 'assault', reason: 'Violent crime in progress' },
            { word: 'robbery', reason: 'Armed/violent theft' },
            { word: 'drowning', reason: 'Water emergency - time critical' },
            { word: 'choking', reason: 'Airway obstruction' },
            { word: 'chest pain', reason: 'Possible cardiac event' },
            { word: 'fall', reason: 'Fall injury - trauma risk' },
            { word: 'hit by car', reason: 'Pedestrian struck' }
        ],
        baseScore: 75,
        color: '#f59e0b'
    },
    medium: {
        keywords: [
            { word: 'fight', reason: 'Physical altercation' },
            { word: 'dispute', reason: 'Civil dispute/disturbance' },
            { word: 'minor injury', reason: 'Non-life-threatening injury' },
            { word: 'theft', reason: 'Property crime' },
            { word: 'vandalism', reason: 'Property damage' },
            { word: 'smoke', reason: 'Smoke detected - possible fire' },
            { word: 'alarm', reason: 'Alarm activation' },
            { word: 'suspicious', reason: 'Suspicious activity' }
        ],
        baseScore: 50,
        color: '#3b82f6'
    }
};

const TYPE_SCORES = {
    fire: { score: 65, reason: 'Fire incidents have high base priority due to spread risk' },
    medical: { score: 55, reason: 'Medical emergencies require rapid response' },
    accident: { score: 50, reason: 'Accidents often involve injuries and traffic hazards' },
    police: { score: 45, reason: 'Law enforcement situations require coordinated response' },
    flood: { score: 40, reason: 'Flood situations require evacuation resources' },
    other: { score: 25, reason: 'Unclassified incident - requires assessment' }
};

/**
 * Analyze incident and return full explanation
 */
export const explainSeverityDecision = (type, description) => {
    const text = (description || '').toLowerCase();
    const typeKey = (type || 'other').toLowerCase();
    
    const explanation = {
        finalSeverity: 'low',
        finalScore: 25,
        confidence: 0,
        
        // Rule path explanation
        rulePath: [],
        
        // Matched keywords with highlighting
        matchedKeywords: [],
        
        // Type-based scoring
        typeAnalysis: null,
        
        // Decision factors
        decisionFactors: [],
        
        // What could change the decision
        alternativeScenarios: [],
        
        // Human-readable summary
        summary: '',
        
        // Timestamp
        analyzedAt: new Date().toISOString()
    };

    // Step 1: Analyze incident type
    const typeInfo = TYPE_SCORES[typeKey] || TYPE_SCORES.other;
    explanation.typeAnalysis = {
        type: typeKey,
        baseScore: typeInfo.score,
        reason: typeInfo.reason
    };
    explanation.rulePath.push({
        step: 1,
        rule: 'Type Classification',
        input: typeKey,
        output: `Base score: ${typeInfo.score}`,
        reason: typeInfo.reason
    });

    let baseScore = typeInfo.score;
    let matchedSeverity = 'low';

    // Step 2: Scan for critical keywords
    for (const kw of KEYWORD_RULES.critical.keywords) {
        if (text.includes(kw.word)) {
            explanation.matchedKeywords.push({
                keyword: kw.word,
                severity: 'critical',
                reason: kw.reason,
                position: text.indexOf(kw.word),
                color: KEYWORD_RULES.critical.color
            });
        }
    }

    // Step 3: Scan for high keywords
    for (const kw of KEYWORD_RULES.high.keywords) {
        if (text.includes(kw.word)) {
            explanation.matchedKeywords.push({
                keyword: kw.word,
                severity: 'high',
                reason: kw.reason,
                position: text.indexOf(kw.word),
                color: KEYWORD_RULES.high.color
            });
        }
    }

    // Step 4: Scan for medium keywords
    for (const kw of KEYWORD_RULES.medium.keywords) {
        if (text.includes(kw.word)) {
            explanation.matchedKeywords.push({
                keyword: kw.word,
                severity: 'medium',
                reason: kw.reason,
                position: text.indexOf(kw.word),
                color: KEYWORD_RULES.medium.color
            });
        }
    }

    // Sort by position in text
    explanation.matchedKeywords.sort((a, b) => a.position - b.position);

    // Step 5: Determine final severity
    const hasCritical = explanation.matchedKeywords.some(k => k.severity === 'critical');
    const hasHigh = explanation.matchedKeywords.some(k => k.severity === 'high');
    const hasMedium = explanation.matchedKeywords.some(k => k.severity === 'medium');

    if (hasCritical) {
        baseScore = 95;
        matchedSeverity = 'critical';
        explanation.rulePath.push({
            step: 2,
            rule: 'Critical Keyword Match',
            input: explanation.matchedKeywords.filter(k => k.severity === 'critical').map(k => k.keyword).join(', '),
            output: 'Severity: CRITICAL, Score: 95',
            reason: 'Critical keywords indicate life-threatening emergency'
        });
        explanation.decisionFactors.push({
            factor: 'Critical keyword detected',
            impact: 'Maximum priority assigned',
            weight: 'Decisive'
        });
    } else if (hasHigh || baseScore >= 60) {
        baseScore = Math.max(baseScore, 75);
        matchedSeverity = 'high';
        explanation.rulePath.push({
            step: 2,
            rule: 'High Priority Assessment',
            input: hasHigh ? 'High-priority keywords found' : 'High base score from type',
            output: `Severity: HIGH, Score: ${baseScore}`,
            reason: 'Situation requires priority response'
        });
        explanation.decisionFactors.push({
            factor: hasHigh ? 'High-priority keyword detected' : 'Incident type has high base priority',
            impact: 'Elevated priority assigned',
            weight: 'Significant'
        });
    } else if (hasMedium || baseScore >= 40) {
        baseScore = Math.max(baseScore, 50);
        matchedSeverity = 'medium';
        explanation.rulePath.push({
            step: 2,
            rule: 'Medium Priority Assessment',
            input: hasMedium ? 'Medium-priority keywords found' : 'Moderate base score',
            output: `Severity: MEDIUM, Score: ${baseScore}`,
            reason: 'Standard response protocol applies'
        });
    } else {
        explanation.rulePath.push({
            step: 2,
            rule: 'Default Assessment',
            input: 'No priority keywords detected',
            output: `Severity: LOW, Score: ${baseScore}`,
            reason: 'Routine response recommended'
        });
    }

    // Calculate confidence based on matches
    const keywordCount = explanation.matchedKeywords.length;
    const descriptionLength = text.length;
    
    let confidence = 50; // Base confidence
    if (keywordCount > 0) confidence += keywordCount * 10;
    if (keywordCount > 3) confidence += 15;
    if (descriptionLength > 50) confidence += 10;
    if (hasCritical && hasHigh) confidence += 10; // Multiple severity indicators
    confidence = Math.min(98, confidence); // Cap at 98%

    explanation.confidence = confidence;
    explanation.finalSeverity = matchedSeverity;
    explanation.finalScore = Math.min(100, Math.max(0, baseScore));

    // Generate alternative scenarios
    if (matchedSeverity !== 'critical') {
        explanation.alternativeScenarios.push({
            scenario: 'If description included critical keywords (trapped, fire, cardiac)',
            result: 'Severity would escalate to CRITICAL (95/100)'
        });
    }
    if (keywordCount === 0) {
        explanation.alternativeScenarios.push({
            scenario: 'Adding specific details about injuries or hazards',
            result: 'Would increase confidence and potentially severity'
        });
    }

    // Generate human-readable summary
    explanation.summary = generateSummary(explanation);

    return explanation;
};

/**
 * Generate human-readable summary
 */
const generateSummary = (explanation) => {
    const { finalSeverity, finalScore, confidence, matchedKeywords, typeAnalysis } = explanation;
    
    let summary = `This ${typeAnalysis.type} incident was classified as ${finalSeverity.toUpperCase()} `;
    summary += `with a priority score of ${finalScore}/100 (${confidence}% confidence). `;
    
    if (matchedKeywords.length > 0) {
        const keywordList = matchedKeywords.slice(0, 3).map(k => `"${k.keyword}"`).join(', ');
        summary += `Key indicators: ${keywordList}. `;
    } else {
        summary += `Classification based on incident type baseline. `;
    }
    
    summary += typeAnalysis.reason;
    
    return summary;
};

/**
 * Highlight keywords in original text
 */
export const highlightKeywordsInText = (text, matchedKeywords) => {
    if (!text || !matchedKeywords.length) return text;
    
    let result = text;
    const sortedKeywords = [...matchedKeywords].sort((a, b) => b.keyword.length - a.keyword.length);
    
    sortedKeywords.forEach(match => {
        const regex = new RegExp(`(${match.keyword})`, 'gi');
        result = result.replace(regex, `<mark style="background-color: ${match.color}33; color: ${match.color}; padding: 2px 4px; border-radius: 3px; font-weight: 600;">$1</mark>`);
    });
    
    return result;
};

/**
 * Get confidence level label
 */
export const getConfidenceLabel = (confidence) => {
    if (confidence >= 90) return { label: 'Very High', color: '#10b981' };
    if (confidence >= 75) return { label: 'High', color: '#3b82f6' };
    if (confidence >= 60) return { label: 'Moderate', color: '#f59e0b' };
    if (confidence >= 40) return { label: 'Low', color: '#ef4444' };
    return { label: 'Very Low', color: '#6b7280' };
};

export default {
    explainSeverityDecision,
    highlightKeywordsInText,
    getConfidenceLabel,
    KEYWORD_RULES,
    TYPE_SCORES
};
