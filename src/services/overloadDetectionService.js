/**
 * Overload Detection Service
 * Detects when multiple incidents occur in the same area
 * Flags areas as "OVERLOAD ZONE" and suggests mutual aid
 */

import api from './apiService';

// Configuration
const CONFIG = {
    clusterRadiusMiles: 2,        // Incidents within 2 miles considered clustered
    overloadThreshold: 3,          // 3+ incidents = overload
    criticalOverloadThreshold: 5,  // 5+ incidents = critical overload
    resourceStretchThreshold: 0.7, // 70% resources used = stretched
    criticalStretchThreshold: 0.9, // 90% resources used = critical
    timeWindowMinutes: 60          // Consider incidents within last 60 minutes
};

// Resource capacity (configurable per deployment)
const RESOURCE_CAPACITY = {
    ambulance: 6,
    fire: 4,
    police: 8,
    rescue: 2
};

/**
 * Calculate distance between two points (Haversine formula)
 */
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

/**
 * Extract coordinates from incident location
 */
const getCoordinates = (incident) => {
    const loc = incident.location;
    if (!loc) return null;

    return {
        lat: loc.latitude || loc._lat || loc.lat,
        lng: loc.longitude || loc._long || loc.lng
    };
};

/**
 * Cluster incidents by geographic proximity
 */
export const clusterIncidents = (incidents, radiusMiles = CONFIG.clusterRadiusMiles) => {
    const clusters = [];
    const assigned = new Set();

    // Filter to active incidents only
    const activeIncidents = incidents.filter(inc =>
        ['reported', 'assigned', 'in_progress', 'on_the_way'].includes(inc.status)
    );

    activeIncidents.forEach((incident, i) => {
        if (assigned.has(incident.id)) return;

        const coords = getCoordinates(incident);
        if (!coords) return;

        const cluster = {
            id: `cluster-${clusters.length + 1}`,
            incidents: [incident],
            center: { lat: coords.lat, lng: coords.lng },
            radius: 0
        };

        assigned.add(incident.id);

        // Find nearby incidents
        activeIncidents.forEach((other, j) => {
            if (i === j || assigned.has(other.id)) return;

            const otherCoords = getCoordinates(other);
            if (!otherCoords) return;

            const distance = calculateDistance(
                coords.lat, coords.lng,
                otherCoords.lat, otherCoords.lng
            );

            if (distance <= radiusMiles) {
                cluster.incidents.push(other);
                cluster.radius = Math.max(cluster.radius, distance);
                assigned.add(other.id);

                // Recalculate center
                const allLats = cluster.incidents.map(inc => {
                    const c = getCoordinates(inc);
                    return c?.lat || 0;
                });
                const allLngs = cluster.incidents.map(inc => {
                    const c = getCoordinates(inc);
                    return c?.lng || 0;
                });

                cluster.center = {
                    lat: allLats.reduce((a, b) => a + b, 0) / allLats.length,
                    lng: allLngs.reduce((a, b) => a + b, 0) / allLngs.length
                };
            }
        });

        clusters.push(cluster);
    });

    return clusters;
};

/**
 * Detect overload zones
 */
export const detectOverloadZones = (incidents, deployedResources = {}) => {
    const clusters = clusterIncidents(incidents);
    const overloadZones = [];

    clusters.forEach(cluster => {
        const incidentCount = cluster.incidents.length;

        if (incidentCount >= CONFIG.overloadThreshold) {
            // Calculate severity distribution
            const severityCount = {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            };

            cluster.incidents.forEach(inc => {
                severityCount[inc.severity || 'medium']++;
            });

            // Determine zone severity
            let zoneSeverity = 'elevated';
            if (incidentCount >= CONFIG.criticalOverloadThreshold || severityCount.critical >= 2) {
                zoneSeverity = 'critical';
            } else if (severityCount.critical >= 1 || severityCount.high >= 2) {
                zoneSeverity = 'high';
            }

            // Calculate required resources
            const requiredResources = calculateRequiredResources(cluster.incidents);

            // Get area name (from first incident's address)
            const areaName = cluster.incidents[0]?.address?.split(',')[0] || 'Unknown Area';

            overloadZones.push({
                id: cluster.id,
                center: cluster.center,
                radius: Math.max(cluster.radius, 0.5), // Minimum 0.5 mile radius
                incidentCount,
                incidents: cluster.incidents,
                severity: zoneSeverity,
                severityBreakdown: severityCount,
                areaName,
                requiredResources,
                status: 'active',
                detectedAt: new Date()
            });
        }
    });

    return overloadZones;
};

/**
 * Calculate required resources for a cluster
 */
const calculateRequiredResources = (incidents) => {
    const resources = {
        ambulance: 0,
        fire: 0,
        police: 0,
        rescue: 0
    };

    incidents.forEach(incident => {
        const type = incident.type || 'other';
        const severity = incident.severity || 'medium';

        // Base allocation by type
        const allocations = {
            medical: { ambulance: 1, fire: 0, police: 0, rescue: 0 },
            fire: { ambulance: 1, fire: 2, police: 0, rescue: 0 },
            accident: { ambulance: 1, fire: 0, police: 1, rescue: 0 },
            police: { ambulance: 0, fire: 0, police: 2, rescue: 0 },
            flood: { ambulance: 0, fire: 0, police: 0, rescue: 1 },
            other: { ambulance: 0, fire: 0, police: 1, rescue: 0 }
        };

        const alloc = allocations[type] || allocations.other;

        // Severity multiplier
        const multiplier = severity === 'critical' ? 2 : severity === 'high' ? 1.5 : 1;

        Object.keys(alloc).forEach(key => {
            resources[key] += Math.ceil(alloc[key] * multiplier);
        });
    });

    return resources;
};

/**
 * Calculate resource utilization
 */
export const calculateResourceUtilization = (deployedResources = {}) => {
    const utilization = {};
    let totalCapacity = 0;
    let totalDeployed = 0;

    Object.keys(RESOURCE_CAPACITY).forEach(type => {
        const capacity = RESOURCE_CAPACITY[type];
        const deployed = deployedResources[type] || 0;
        const ratio = capacity > 0 ? deployed / capacity : 0;

        utilization[type] = {
            capacity,
            deployed,
            available: capacity - deployed,
            ratio,
            status: ratio >= CONFIG.criticalStretchThreshold ? 'critical' :
                ratio >= CONFIG.resourceStretchThreshold ? 'stretched' : 'normal'
        };

        totalCapacity += capacity;
        totalDeployed += deployed;
    });

    const overallRatio = totalCapacity > 0 ? totalDeployed / totalCapacity : 0;

    return {
        byType: utilization,
        overall: {
            capacity: totalCapacity,
            deployed: totalDeployed,
            available: totalCapacity - totalDeployed,
            ratio: overallRatio,
            status: overallRatio >= CONFIG.criticalStretchThreshold ? 'critical' :
                overallRatio >= CONFIG.resourceStretchThreshold ? 'stretched' : 'normal'
        }
    };
};

/**
 * Generate mutual aid suggestions
 */
export const generateMutualAidSuggestions = (overloadZone, utilization) => {
    const suggestions = [];

    // Check resource shortfall
    const shortfall = {};
    Object.keys(overloadZone.requiredResources).forEach(type => {
        const required = overloadZone.requiredResources[type];
        const available = utilization.byType[type]?.available || 0;

        if (required > available) {
            shortfall[type] = required - available;
        }
    });

    if (Object.keys(shortfall).length > 0) {
        suggestions.push({
            type: 'resource_request',
            priority: 'high',
            title: 'Request Additional Resources',
            description: `Shortfall detected: ${Object.entries(shortfall).map(([k, v]) => `${v} ${k}`).join(', ')}`,
            action: 'Contact neighboring jurisdictions for mutual aid'
        });
    }

    // Suggest staging area
    if (overloadZone.incidentCount >= 4) {
        suggestions.push({
            type: 'staging',
            priority: 'high',
            title: 'Establish Staging Area',
            description: `${overloadZone.incidentCount} active incidents in cluster`,
            action: `Set up command post near ${overloadZone.areaName}`
        });
    }

    // Suggest backup
    if (overloadZone.severity === 'critical') {
        suggestions.push({
            type: 'backup',
            priority: 'critical',
            title: 'Activate Emergency Backup',
            description: 'Critical overload zone detected',
            action: 'Activate off-duty personnel and reserve units'
        });
    }

    // Suggest perimeter
    if (overloadZone.incidentCount >= 3) {
        suggestions.push({
            type: 'perimeter',
            priority: 'medium',
            title: 'Establish Traffic Perimeter',
            description: 'Multiple incidents may cause congestion',
            action: 'Set up traffic control around affected area'
        });
    }

    return suggestions;
};

/**
 * Get overall system status
 */
export const getSystemStatus = (incidents, deployedResources = {}) => {
    const overloadZones = detectOverloadZones(incidents, deployedResources);
    const utilization = calculateResourceUtilization(deployedResources);

    let systemStatus = 'normal';
    let alerts = [];

    // Check for critical overload zones
    const criticalZones = overloadZones.filter(z => z.severity === 'critical');
    if (criticalZones.length > 0) {
        systemStatus = 'critical';
        alerts.push({
            type: 'overload',
            severity: 'critical',
            message: `${criticalZones.length} critical overload zone(s) detected`
        });
    } else if (overloadZones.length > 0) {
        systemStatus = 'elevated';
        alerts.push({
            type: 'overload',
            severity: 'high',
            message: `${overloadZones.length} overload zone(s) detected`
        });
    }

    // Check resource strain
    if (utilization.overall.status === 'critical') {
        systemStatus = 'critical';
        alerts.push({
            type: 'resources',
            severity: 'critical',
            message: `Resources at ${Math.round(utilization.overall.ratio * 100)}% capacity`
        });
    } else if (utilization.overall.status === 'stretched') {
        if (systemStatus === 'normal') systemStatus = 'elevated';
        alerts.push({
            type: 'resources',
            severity: 'high',
            message: `Resources stretched at ${Math.round(utilization.overall.ratio * 100)}% capacity`
        });
    }

    return {
        status: systemStatus,
        alerts,
        overloadZones,
        utilization,
        activeIncidents: incidents.filter(i =>
            ['reported', 'assigned', 'in_progress', 'on_the_way'].includes(i.status)
        ).length
    };
};

export const reportOverloadZone = async (zoneData) => {
    try {
        await api.post('/overload-zones', zoneData);
    } catch (error) {
        console.error('Failed to report overload zone:', error);
    }
};

export default {
    clusterIncidents,
    detectOverloadZones,
    calculateResourceUtilization,
    generateMutualAidSuggestions,
    getSystemStatus,
    reportOverloadZone,
    CONFIG
};
