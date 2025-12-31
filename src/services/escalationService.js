/**
 * Escalation Service
 * Automatic priority escalation system for unresolved incidents
 * Alerts higher authority when incidents remain unaddressed
 */

import api from './apiService';

// Escalation levels and thresholds
const ESCALATION_LEVELS = [
    {
        level: 1,
        name: 'Initial Response',
        role: 'volunteer',
        description: 'Volunteer responders notified',
        icon: '👤',
        color: '#3b82f6'
    },
    {
        level: 2,
        name: 'Team Response',
        role: 'team_lead',
        description: 'Team lead alerted, additional resources requested',
        icon: '👥',
        color: '#f59e0b'
    },
    {
        level: 3,
        name: 'Supervisor Alert',
        role: 'supervisor',
        description: 'Supervisor notified, priority elevated',
        icon: '📋',
        color: '#f97316'
    },
    {
        level: 4,
        name: 'Command Center',
        role: 'agency',
        description: 'Agency command center taking over',
        icon: '🏢',
        color: '#ef4444'
    },
    {
        level: 5,
        name: 'Emergency Director',
        role: 'director',
        description: 'Emergency director intervention',
        icon: '🚨',
        color: '#dc2626'
    }
];

// Time thresholds for escalation (in minutes) based on severity
const ESCALATION_TIMINGS = {
    critical: {
        1: 0,      // Immediate
        2: 3,      // 3 minutes
        3: 5,      // 5 minutes
        4: 8,      // 8 minutes
        5: 12      // 12 minutes
    },
    high: {
        1: 0,
        2: 5,
        3: 10,
        4: 15,
        5: 25
    },
    medium: {
        1: 0,
        2: 10,
        3: 20,
        4: 35,
        5: 60
    },
    low: {
        1: 0,
        2: 15,
        3: 30,
        4: 60,
        5: 120
    }
};

/**
 * Calculate current escalation level for an incident
 */
export const calculateEscalationLevel = (incident) => {
    const severity = incident.severity || 'medium';
    const status = incident.status || 'reported';
    const createdAt = incident.createdAt;

    // Resolved/cancelled incidents don't escalate
    if (status === 'resolved' || status === 'cancelled') {
        return {
            currentLevel: 0,
            escalationPaused: true,
            reason: 'Incident resolved'
        };
    }

    // Calculate time elapsed
    const now = Date.now();
    const created = createdAt?.toDate?.() || createdAt?.seconds * 1000 || Date.now();
    const elapsedMinutes = Math.floor((now - created) / 60000);

    // Get timing thresholds for this severity
    const timings = ESCALATION_TIMINGS[severity] || ESCALATION_TIMINGS.medium;

    // Determine current level
    let currentLevel = 1;
    for (let level = 5; level >= 1; level--) {
        if (elapsedMinutes >= timings[level]) {
            currentLevel = level;
            break;
        }
    }

    // Check if status affects escalation
    const statusPauses = {
        'assigned': 1,       // Pauses at level 1-2
        'on_the_way': 2,     // Pauses at level 2-3
        'in_progress': 3     // Pauses at level 3-4
    };

    const pauseLevel = statusPauses[status] || 0;
    const escalationPaused = pauseLevel > 0 && currentLevel <= pauseLevel + 1;

    return {
        currentLevel,
        escalationPaused,
        elapsedMinutes,
        severity,
        timings,
        pauseLevel: pauseLevel > 0 ? pauseLevel : null,
        reason: escalationPaused
            ? `Response in progress (${status.replace('_', ' ')})`
            : null
    };
};

/**
 * Get escalation timeline for an incident
 */
export const getEscalationTimeline = (incident) => {
    const { currentLevel, escalationPaused, elapsedMinutes, severity, timings, pauseLevel, reason } =
        calculateEscalationLevel(incident);

    const timeline = ESCALATION_LEVELS.map(level => {
        const threshold = timings[level.level];
        const isReached = elapsedMinutes >= threshold;
        const isCurrent = level.level === currentLevel;
        const isPaused = escalationPaused && level.level === currentLevel;
        const timeRemaining = threshold - elapsedMinutes;

        return {
            ...level,
            threshold,
            isReached,
            isCurrent,
            isPaused,
            timeReached: isReached ? Math.max(0, elapsedMinutes - threshold) : null,
            timeRemaining: !isReached ? timeRemaining : null,
            status: isPaused ? 'paused' : isReached ? 'reached' : 'pending'
        };
    });

    // Calculate next escalation
    const nextLevel = timeline.find(l => !l.isReached);
    const nextEscalation = nextLevel ? {
        level: nextLevel.level,
        name: nextLevel.name,
        inMinutes: nextLevel.timeRemaining,
        at: new Date(Date.now() + nextLevel.timeRemaining * 60000)
    } : null;

    return {
        timeline,
        currentLevel,
        currentLevelInfo: ESCALATION_LEVELS[currentLevel - 1],
        escalationPaused,
        pauseReason: reason,
        elapsedMinutes,
        severity,
        nextEscalation,
        urgencyScore: calculateUrgencyScore(currentLevel, elapsedMinutes, severity)
    };
};

/**
 * Calculate urgency score (0-100)
 */
const calculateUrgencyScore = (level, elapsed, severity) => {
    const severityMultiplier = {
        critical: 1.5,
        high: 1.2,
        medium: 1.0,
        low: 0.7
    };

    let score = level * 20; // Base: 20 per level
    score += Math.min(elapsed, 30); // Bonus for time elapsed
    score *= severityMultiplier[severity] || 1;

    return Math.min(100, Math.round(score));
};

/**
 * Get escalation actions for a level
 */
export const getEscalationActions = (level) => {
    const actions = {
        1: [
            'Notify nearby volunteers',
            'Send push notification',
            'Display on dashboard'
        ],
        2: [
            'Alert team lead',
            'Request additional volunteers',
            'Increase map visibility'
        ],
        3: [
            'Notify supervisor',
            'Trigger agency alert',
            'Prepare resource dispatch'
        ],
        4: [
            'Command center takeover',
            'Dispatch emergency resources',
            'Open direct communication channel'
        ],
        5: [
            'Emergency director notified',
            'All available resources mobilized',
            'Media blackout protocol available',
            'Government liaison alerted'
        ]
    };

    return actions[level] || [];
};

/**
 * Check if incident needs immediate attention
 */
export const needsImmediateAttention = (incident) => {
    const { currentLevel, escalationPaused, elapsedMinutes } = calculateEscalationLevel(incident);

    // Critical at level 3+ or any at level 4+
    if (incident.severity === 'critical' && currentLevel >= 3) return true;
    if (currentLevel >= 4) return true;

    // Long unattended incidents
    if (!escalationPaused && elapsedMinutes > 20) return true;

    return false;
};

/**
 * Get escalation alerts for dashboard
 */
export const getEscalationAlerts = (incidents) => {
    const alerts = [];

    incidents.forEach(incident => {
        const escalation = calculateEscalationLevel(incident);

        if (escalation.currentLevel >= 3 && !escalation.escalationPaused) {
            alerts.push({
                incidentId: incident.id,
                type: incident.type,
                severity: incident.severity,
                level: escalation.currentLevel,
                levelInfo: ESCALATION_LEVELS[escalation.currentLevel - 1],
                elapsedMinutes: escalation.elapsedMinutes,
                message: `${incident.type} incident escalated to Level ${escalation.currentLevel}`,
                urgency: needsImmediateAttention(incident) ? 'critical' : 'high'
            });
        }
    });

    return alerts.sort((a, b) => b.level - a.level);
};

export const syncEscalationStatus = async (incidentId, escalationData) => {
    try {
        await api.post(`/incidents/${incidentId}/escalate`, escalationData);
    } catch (error) {
        console.error('Failed to sync escalation status:', error);
    }
};

export default {
    ESCALATION_LEVELS,
    ESCALATION_TIMINGS,
    calculateEscalationLevel,
    getEscalationTimeline,
    getEscalationActions,
    needsImmediateAttention,
    getEscalationAlerts,
    syncEscalationStatus
};
