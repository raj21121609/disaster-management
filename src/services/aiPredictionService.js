import api from './apiService';

export const predictResources = async (incident) => {
    try {
        const response = await api.post('/predict-resources', {
            type: incident.type,
            severity: incident.severity,
            description: incident.description,
            location: incident.address
        });

        if (response.data) {
            return response.data;
        }
    } catch (error) {
        console.warn('Backend prediction unavailable, using local prediction');
    }

    return localResourcePrediction(incident);
};

export const localResourcePrediction = (incident) => {
    const { type, severity, description = '' } = incident;
    const text = description.toLowerCase();

    const predictions = {
        resources: [],
        estimatedResponseTime: 0,
        confidence: 0,
        recommendations: [],
        riskAssessment: '',
        requiredPersonnel: 0
    };

    switch (type) {
        case 'medical':
            predictions.resources.push({
                type: 'Ambulance',
                quantity: severity === 'critical' ? 2 : 1,
                icon: '🚑',
                priority: 'high'
            });
            if (severity === 'critical' || text.includes('cardiac') || text.includes('stroke')) {
                predictions.resources.push({
                    type: 'Advanced Life Support Unit',
                    quantity: 1,
                    icon: '🏥',
                    priority: 'critical'
                });
                predictions.requiredPersonnel = 6;
            } else {
                predictions.requiredPersonnel = 3;
            }
            if (text.includes('multiple') || text.includes('mass')) {
                predictions.resources[0].quantity = 3;
                predictions.resources.push({
                    type: 'Medical Command Unit',
                    quantity: 1,
                    icon: '🎖️',
                    priority: 'high'
                });
                predictions.requiredPersonnel = 12;
            }
            predictions.estimatedResponseTime = severity === 'critical' ? 4 : 7;
            predictions.recommendations.push('Dispatch nearest available unit');
            predictions.recommendations.push('Alert receiving hospital');
            break;

        case 'fire':
            predictions.resources.push({
                type: 'Fire Engine',
                quantity: severity === 'critical' ? 3 : 2,
                icon: '🚒',
                priority: 'critical'
            });
            predictions.resources.push({
                type: 'Ladder Truck',
                quantity: 1,
                icon: '🪜',
                priority: 'high'
            });
            if (severity === 'critical' || text.includes('trapped') || text.includes('building')) {
                predictions.resources.push({
                    type: 'Rescue Squad',
                    quantity: 1,
                    icon: '🦺',
                    priority: 'critical'
                });
                predictions.resources.push({
                    type: 'Ambulance',
                    quantity: 2,
                    icon: '🚑',
                    priority: 'high'
                });
                predictions.requiredPersonnel = 20;
            } else {
                predictions.requiredPersonnel = 12;
            }
            predictions.estimatedResponseTime = severity === 'critical' ? 5 : 8;
            predictions.recommendations.push('Establish incident command');
            predictions.recommendations.push('Notify utility companies');
            predictions.recommendations.push('Stage EMS for standby');
            break;

        case 'accident':
            predictions.resources.push({
                type: 'Police Unit',
                quantity: 2,
                icon: '🚔',
                priority: 'high'
            });
            predictions.resources.push({
                type: 'Ambulance',
                quantity: severity === 'critical' ? 2 : 1,
                icon: '🚑',
                priority: 'high'
            });
            if (text.includes('trapped') || text.includes('extrication')) {
                predictions.resources.push({
                    type: 'Fire/Rescue',
                    quantity: 1,
                    icon: '🚒',
                    priority: 'critical'
                });
                predictions.requiredPersonnel = 10;
            } else {
                predictions.requiredPersonnel = 6;
            }
            if (text.includes('highway') || text.includes('freeway')) {
                predictions.resources.push({
                    type: 'Traffic Control',
                    quantity: 1,
                    icon: '🚧',
                    priority: 'medium'
                });
            }
            predictions.estimatedResponseTime = severity === 'critical' ? 5 : 9;
            predictions.recommendations.push('Secure accident scene');
            predictions.recommendations.push('Request tow service');
            break;

        case 'flood':
            predictions.resources.push({
                type: 'Water Rescue Team',
                quantity: severity === 'critical' ? 2 : 1,
                icon: '🚤',
                priority: 'critical'
            });
            predictions.resources.push({
                type: 'Evacuation Bus',
                quantity: 1,
                icon: '🚌',
                priority: 'high'
            });
            predictions.resources.push({
                type: 'Emergency Shelter',
                quantity: 1,
                icon: '🏠',
                priority: 'medium'
            });
            predictions.requiredPersonnel = severity === 'critical' ? 15 : 8;
            predictions.estimatedResponseTime = 10;
            predictions.recommendations.push('Activate flood emergency protocol');
            predictions.recommendations.push('Coordinate with Red Cross');
            predictions.recommendations.push('Monitor water levels');
            break;

        case 'police':
            predictions.resources.push({
                type: 'Police Unit',
                quantity: severity === 'critical' ? 4 : 2,
                icon: '🚔',
                priority: 'critical'
            });
            if (severity === 'critical' || text.includes('weapon') || text.includes('armed')) {
                predictions.resources.push({
                    type: 'SWAT/Tactical Unit',
                    quantity: 1,
                    icon: '🎯',
                    priority: 'critical'
                });
                predictions.resources.push({
                    type: 'Ambulance (Standby)',
                    quantity: 2,
                    icon: '🚑',
                    priority: 'high'
                });
                predictions.requiredPersonnel = 20;
            } else {
                predictions.requiredPersonnel = 4;
            }
            predictions.estimatedResponseTime = severity === 'critical' ? 3 : 6;
            predictions.recommendations.push('Establish perimeter');
            predictions.recommendations.push('Gather witness information');
            break;

        default:
            predictions.resources.push({
                type: 'First Responder',
                quantity: 1,
                icon: '🦺',
                priority: 'medium'
            });
            predictions.requiredPersonnel = 2;
            predictions.estimatedResponseTime = 10;
            predictions.recommendations.push('Assess situation on arrival');
    }

    const severityMultiplier = {
        critical: 1.0,
        high: 0.85,
        medium: 0.7,
        low: 0.5
    };
    predictions.confidence = Math.round((severityMultiplier[severity] || 0.7) * 100);

    if (severity === 'critical') {
        predictions.riskAssessment = 'HIGH RISK - Immediate action required. Multiple resources recommended.';
    } else if (severity === 'high') {
        predictions.riskAssessment = 'ELEVATED RISK - Priority response needed. Monitor for escalation.';
    } else if (severity === 'medium') {
        predictions.riskAssessment = 'MODERATE RISK - Standard response protocol. Assess on arrival.';
    } else {
        predictions.riskAssessment = 'LOW RISK - Routine response. Single unit may suffice.';
    }

    predictions.supplies = getRequiredSupplies(type, severity);

    return predictions;
};

const getRequiredSupplies = (type, severity) => {
    const supplies = [];

    switch (type) {
        case 'medical':
            supplies.push({ name: 'First Aid Kit', quantity: 2 });
            supplies.push({ name: 'Oxygen Tank', quantity: 1 });
            supplies.push({ name: 'Stretcher', quantity: 1 });
            if (severity === 'critical') {
                supplies.push({ name: 'Defibrillator', quantity: 1 });
                supplies.push({ name: 'IV Kit', quantity: 2 });
            }
            break;
        case 'fire':
            supplies.push({ name: 'Fire Hose', quantity: 4 });
            supplies.push({ name: 'Breathing Apparatus', quantity: 6 });
            supplies.push({ name: 'Fire Extinguisher', quantity: 4 });
            if (severity === 'critical') {
                supplies.push({ name: 'Rescue Equipment', quantity: 1 });
                supplies.push({ name: 'Thermal Camera', quantity: 2 });
            }
            break;
        case 'flood':
            supplies.push({ name: 'Life Jackets', quantity: 20 });
            supplies.push({ name: 'Rope/Throw Bag', quantity: 10 });
            supplies.push({ name: 'Emergency Blankets', quantity: 30 });
            break;
        case 'accident':
            supplies.push({ name: 'Traffic Cones', quantity: 10 });
            supplies.push({ name: 'First Aid Kit', quantity: 2 });
            supplies.push({ name: 'Flares', quantity: 6 });
            break;
        default:
            supplies.push({ name: 'First Aid Kit', quantity: 1 });
            supplies.push({ name: 'Flashlight', quantity: 2 });
    }

    return supplies;
};

export const analyzeIncidentTrends = (incidents) => {
    if (!incidents || incidents.length === 0) {
        return {
            hotspots: [],
            peakHours: [],
            typeDistribution: {},
            predictions: []
        };
    }

    const typeCount = {};
    const hourCount = new Array(24).fill(0);
    const locationClusters = {};

    incidents.forEach(incident => {
        typeCount[incident.type] = (typeCount[incident.type] || 0) + 1;

        if (incident.createdAt) {
            const hour = new Date(incident.createdAt.toDate?.() || incident.createdAt).getHours();
            hourCount[hour]++;
        }

        const address = incident.location?.address || incident.address;
        if (address) {
            const area = address.split(',')[0];
            locationClusters[area] = (locationClusters[area] || 0) + 1;
        }
    });

    const peakHours = hourCount
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    const hotspots = Object.entries(locationClusters)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const predictions = [];

    if (typeCount['medical'] > typeCount['fire']) {
        predictions.push({
            type: 'resource',
            message: 'High medical incident rate - Consider increasing ambulance availability',
            priority: 'high'
        });
    }

    if (peakHours[0]?.count > 5) {
        predictions.push({
            type: 'staffing',
            message: `Peak activity at ${peakHours[0].hour}:00 - Recommend additional staffing`,
            priority: 'medium'
        });
    }

    return {
        hotspots,
        peakHours,
        typeDistribution: typeCount,
        predictions
    };
};
