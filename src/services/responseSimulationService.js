/**
 * Response Time Simulation Service
 * Provides "What-If" analysis for resource allocation decisions
 * Shows impact of resource changes on response times and outcomes
 */

// Base response times by resource type (in minutes)
const BASE_RESPONSE_TIMES = {
    ambulance: 7,
    fire: 6,
    police: 5,
    rescue: 8,
    helicopter: 12
};

// Survival/outcome probabilities by incident type and response time
const OUTCOME_CURVES = {
    medical: {
        // Cardiac arrest survival rate drops ~10% per minute
        criticalThreshold: 8,  // minutes
        survivalBase: 90,
        decayRate: 10,  // % per minute after threshold
        optimalTime: 4
    },
    fire: {
        // Fire doubles every minute after flashover
        criticalThreshold: 5,
        survivalBase: 95,
        decayRate: 8,
        optimalTime: 4
    },
    accident: {
        criticalThreshold: 10,
        survivalBase: 85,
        decayRate: 5,
        optimalTime: 6
    },
    flood: {
        criticalThreshold: 15,
        survivalBase: 80,
        decayRate: 3,
        optimalTime: 10
    },
    police: {
        criticalThreshold: 8,
        survivalBase: 75,
        decayRate: 4,
        optimalTime: 5
    }
};

// Resource effectiveness multipliers
const RESOURCE_EFFECTIVENESS = {
    ambulance: { responseReduction: 0, outcomeBoost: 15 },
    fire: { responseReduction: 1, outcomeBoost: 10 },
    police: { responseReduction: 0, outcomeBoost: 5 },
    rescue: { responseReduction: 2, outcomeBoost: 20 },
    helicopter: { responseReduction: 5, outcomeBoost: 25 }
};

/**
 * Calculate base response time for an incident
 */
export const calculateBaseResponseTime = (incident, availableResources = []) => {
    const type = incident.type || 'other';
    const severity = incident.severity || 'medium';
    
    // Get primary resource type for this incident
    const primaryResource = getPrimaryResourceType(type);
    let baseTime = BASE_RESPONSE_TIMES[primaryResource] || 8;
    
    // Severity modifiers
    const severityModifiers = {
        critical: 0.8,  // 20% faster for critical
        high: 0.9,
        medium: 1.0,
        low: 1.2
    };
    baseTime *= severityModifiers[severity] || 1.0;
    
    // Distance modifier (if location available)
    if (incident.distance) {
        baseTime += incident.distance * 0.5; // 30 seconds per mile
    }
    
    return Math.round(baseTime * 10) / 10;
};

/**
 * Get primary resource type for incident type
 */
const getPrimaryResourceType = (incidentType) => {
    const mapping = {
        medical: 'ambulance',
        fire: 'fire',
        accident: 'ambulance',
        flood: 'rescue',
        police: 'police'
    };
    return mapping[incidentType] || 'ambulance';
};

/**
 * Simulate response with different resource configurations
 */
export const simulateResponse = (incident, resourceConfig) => {
    const {
        ambulanceCount = 1,
        fireCount = 0,
        policeCount = 0,
        rescueCount = 0,
        helicopterAvailable = false,
        delayMinutes = 0
    } = resourceConfig;
    
    const type = incident.type || 'medical';
    const severity = incident.severity || 'medium';
    const curve = OUTCOME_CURVES[type] || OUTCOME_CURVES.medical;
    
    // Calculate base response time
    let responseTime = calculateBaseResponseTime(incident);
    
    // Apply resource benefits
    let responseReduction = 0;
    let outcomeBoost = 0;
    
    if (ambulanceCount > 0) {
        responseReduction += RESOURCE_EFFECTIVENESS.ambulance.responseReduction;
        outcomeBoost += RESOURCE_EFFECTIVENESS.ambulance.outcomeBoost * Math.min(ambulanceCount, 2);
    }
    if (fireCount > 0) {
        responseReduction += RESOURCE_EFFECTIVENESS.fire.responseReduction * Math.min(fireCount, 3);
        outcomeBoost += RESOURCE_EFFECTIVENESS.fire.outcomeBoost;
    }
    if (policeCount > 0) {
        outcomeBoost += RESOURCE_EFFECTIVENESS.police.outcomeBoost;
    }
    if (rescueCount > 0) {
        responseReduction += RESOURCE_EFFECTIVENESS.rescue.responseReduction;
        outcomeBoost += RESOURCE_EFFECTIVENESS.rescue.outcomeBoost;
    }
    if (helicopterAvailable) {
        responseReduction += RESOURCE_EFFECTIVENESS.helicopter.responseReduction;
        outcomeBoost += RESOURCE_EFFECTIVENESS.helicopter.outcomeBoost;
    }
    
    // Calculate final response time
    responseTime = Math.max(2, responseTime - responseReduction + delayMinutes);
    
    // Calculate survival/success probability
    let survivalProbability = curve.survivalBase;
    
    if (responseTime > curve.criticalThreshold) {
        const minutesPastThreshold = responseTime - curve.criticalThreshold;
        survivalProbability -= minutesPastThreshold * curve.decayRate;
    } else if (responseTime <= curve.optimalTime) {
        survivalProbability += 5; // Bonus for optimal response
    }
    
    // Apply outcome boost from resources
    survivalProbability = Math.min(99, survivalProbability + outcomeBoost * 0.5);
    survivalProbability = Math.max(5, survivalProbability);
    
    // Severity modifier on survival
    const severityPenalty = { critical: 20, high: 10, medium: 5, low: 0 };
    survivalProbability -= severityPenalty[severity] || 0;
    survivalProbability = Math.max(5, survivalProbability);
    
    // Calculate risk level
    let riskLevel = 'low';
    if (survivalProbability < 40) riskLevel = 'critical';
    else if (survivalProbability < 60) riskLevel = 'high';
    else if (survivalProbability < 80) riskLevel = 'moderate';
    
    return {
        responseTime: Math.round(responseTime * 10) / 10,
        survivalProbability: Math.round(survivalProbability),
        riskLevel,
        criticalThreshold: curve.criticalThreshold,
        optimalTime: curve.optimalTime,
        resourcesDeployed: {
            ambulance: ambulanceCount,
            fire: fireCount,
            police: policeCount,
            rescue: rescueCount,
            helicopter: helicopterAvailable
        },
        delayApplied: delayMinutes,
        recommendations: generateRecommendations(
            responseTime, 
            survivalProbability, 
            curve, 
            resourceConfig
        )
    };
};

/**
 * Generate recommendations based on simulation
 */
const generateRecommendations = (responseTime, survival, curve, config) => {
    const recommendations = [];
    
    if (responseTime > curve.criticalThreshold) {
        recommendations.push({
            priority: 'critical',
            action: 'Response time exceeds critical threshold',
            suggestion: 'Add helicopter or closer staging resources'
        });
    }
    
    if (survival < 60 && !config.helicopterAvailable) {
        recommendations.push({
            priority: 'high',
            action: 'Low survival probability detected',
            suggestion: 'Request air medical transport'
        });
    }
    
    if (config.ambulanceCount < 2 && survival < 70) {
        recommendations.push({
            priority: 'high',
            action: 'Single ambulance may be insufficient',
            suggestion: 'Dispatch backup medical unit'
        });
    }
    
    if (responseTime > curve.optimalTime && config.delayMinutes > 0) {
        recommendations.push({
            priority: 'medium',
            action: `${config.delayMinutes} minute delay detected`,
            suggestion: 'Eliminate delay to improve outcomes by ~' + 
                Math.round(config.delayMinutes * curve.decayRate) + '%'
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            priority: 'low',
            action: 'Resource allocation is optimal',
            suggestion: 'Continue with current deployment'
        });
    }
    
    return recommendations;
};

/**
 * Compare multiple scenarios
 */
export const compareScenarios = (incident, scenarios) => {
    return scenarios.map((scenario, index) => ({
        scenarioId: index + 1,
        name: scenario.name || `Scenario ${index + 1}`,
        ...simulateResponse(incident, scenario.config)
    }));
};

/**
 * Generate scenario presets for an incident
 */
export const generateScenarioPresets = (incident) => {
    const type = incident.type || 'medical';
    
    const presets = [
        {
            name: 'Minimum Response',
            description: 'Basic single-unit response',
            config: {
                ambulanceCount: type === 'medical' || type === 'accident' ? 1 : 0,
                fireCount: type === 'fire' ? 1 : 0,
                policeCount: type === 'police' ? 1 : 0,
                rescueCount: 0,
                helicopterAvailable: false,
                delayMinutes: 0
            }
        },
        {
            name: 'Standard Response',
            description: 'Recommended resource allocation',
            config: {
                ambulanceCount: 1,
                fireCount: type === 'fire' ? 2 : 0,
                policeCount: type === 'police' || type === 'accident' ? 1 : 0,
                rescueCount: 0,
                helicopterAvailable: false,
                delayMinutes: 0
            }
        },
        {
            name: 'Enhanced Response',
            description: 'Multiple units with backup',
            config: {
                ambulanceCount: 2,
                fireCount: type === 'fire' ? 3 : 1,
                policeCount: 1,
                rescueCount: incident.severity === 'critical' ? 1 : 0,
                helicopterAvailable: false,
                delayMinutes: 0
            }
        },
        {
            name: 'Maximum Response',
            description: 'All available resources including air support',
            config: {
                ambulanceCount: 2,
                fireCount: 2,
                policeCount: 2,
                rescueCount: 1,
                helicopterAvailable: true,
                delayMinutes: 0
            }
        },
        {
            name: 'Delayed Response (5 min)',
            description: 'Standard response with 5-minute delay',
            config: {
                ambulanceCount: 1,
                fireCount: type === 'fire' ? 2 : 0,
                policeCount: 0,
                rescueCount: 0,
                helicopterAvailable: false,
                delayMinutes: 5
            }
        }
    ];
    
    return presets;
};

export default {
    calculateBaseResponseTime,
    simulateResponse,
    compareScenarios,
    generateScenarioPresets
};
