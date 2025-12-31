/**
 * Community Trust Score Service
 * Calculates and manages trust scores for users and volunteers
 * Prevents fake reports and builds accountability
 */

import api from './apiService';

// Trust score factors and weights
const TRUST_FACTORS = {
    // Positive factors
    incidentsReported: { weight: 2, max: 50 },           // Valid reports submitted
    incidentsVerified: { weight: 5, max: 100 },          // Reports confirmed by responders
    missionsCompleted: { weight: 10, max: 200 },         // Volunteer missions completed
    onTimeResponses: { weight: 3, max: 60 },             // Responses within target time
    positiveFeedback: { weight: 4, max: 80 },            // Good feedback from agencies
    accountAge: { weight: 0.5, max: 30 },                // Days since account creation
    profileComplete: { weight: 10, max: 10 },            // Complete profile
    verifiedIdentity: { weight: 25, max: 25 },           // ID verified

    // Negative factors
    falseReports: { weight: -20, max: -100 },            // Fake/false reports
    abandonedMissions: { weight: -15, max: -75 },        // Missions dropped after accepting
    lateResponses: { weight: -5, max: -25 },             // Late to assigned incidents
    negativeFeedback: { weight: -10, max: -50 },         // Bad feedback
    reportedByOthers: { weight: -25, max: -100 }         // Reported for misconduct
};

// Trust level thresholds
const TRUST_LEVELS = {
    trusted: { min: 80, label: 'Trusted', color: '#10b981', icon: '🛡️' },
    verified: { min: 60, label: 'Verified', color: '#3b82f6', icon: '✓' },
    standard: { min: 40, label: 'Standard', color: '#f59e0b', icon: '○' },
    new: { min: 20, label: 'New User', color: '#94a3b8', icon: '•' },
    flagged: { min: 0, label: 'Under Review', color: '#ef4444', icon: '⚠' }
};

/**
 * Calculate trust score for a user
 */
export const calculateTrustScore = (userData) => {
    const {
        incidentsReported = 0,
        incidentsVerified = 0,
        missionsCompleted = 0,
        onTimeResponses = 0,
        positiveFeedback = 0,
        accountAgeDays = 0,
        profileComplete = false,
        verifiedIdentity = false,
        falseReports = 0,
        abandonedMissions = 0,
        lateResponses = 0,
        negativeFeedback = 0,
        reportedByOthers = 0
    } = userData;

    let score = 30; // Base score for new users
    const factors = [];

    // Calculate positive factors
    const reportScore = Math.min(
        incidentsReported * TRUST_FACTORS.incidentsReported.weight,
        TRUST_FACTORS.incidentsReported.max
    );
    if (reportScore > 0) {
        factors.push({ name: 'Reports Submitted', value: incidentsReported, impact: reportScore, positive: true });
        score += reportScore;
    }

    const verifiedScore = Math.min(
        incidentsVerified * TRUST_FACTORS.incidentsVerified.weight,
        TRUST_FACTORS.incidentsVerified.max
    );
    if (verifiedScore > 0) {
        factors.push({ name: 'Verified Reports', value: incidentsVerified, impact: verifiedScore, positive: true });
        score += verifiedScore;
    }

    const missionScore = Math.min(
        missionsCompleted * TRUST_FACTORS.missionsCompleted.weight,
        TRUST_FACTORS.missionsCompleted.max
    );
    if (missionScore > 0) {
        factors.push({ name: 'Missions Completed', value: missionsCompleted, impact: missionScore, positive: true });
        score += missionScore;
    }

    const onTimeScore = Math.min(
        onTimeResponses * TRUST_FACTORS.onTimeResponses.weight,
        TRUST_FACTORS.onTimeResponses.max
    );
    if (onTimeScore > 0) {
        factors.push({ name: 'On-Time Responses', value: onTimeResponses, impact: onTimeScore, positive: true });
        score += onTimeScore;
    }

    const feedbackScore = Math.min(
        positiveFeedback * TRUST_FACTORS.positiveFeedback.weight,
        TRUST_FACTORS.positiveFeedback.max
    );
    if (feedbackScore > 0) {
        factors.push({ name: 'Positive Feedback', value: positiveFeedback, impact: feedbackScore, positive: true });
        score += feedbackScore;
    }

    const ageScore = Math.min(
        accountAgeDays * TRUST_FACTORS.accountAge.weight,
        TRUST_FACTORS.accountAge.max
    );
    if (ageScore > 0) {
        factors.push({ name: 'Account Age', value: `${accountAgeDays} days`, impact: ageScore, positive: true });
        score += ageScore;
    }

    if (profileComplete) {
        factors.push({ name: 'Complete Profile', value: 'Yes', impact: TRUST_FACTORS.profileComplete.max, positive: true });
        score += TRUST_FACTORS.profileComplete.max;
    }

    if (verifiedIdentity) {
        factors.push({ name: 'Verified Identity', value: 'Yes', impact: TRUST_FACTORS.verifiedIdentity.max, positive: true });
        score += TRUST_FACTORS.verifiedIdentity.max;
    }

    // Calculate negative factors
    const falseScore = Math.max(
        falseReports * TRUST_FACTORS.falseReports.weight,
        TRUST_FACTORS.falseReports.max
    );
    if (falseScore < 0) {
        factors.push({ name: 'False Reports', value: falseReports, impact: falseScore, positive: false });
        score += falseScore;
    }

    const abandonedScore = Math.max(
        abandonedMissions * TRUST_FACTORS.abandonedMissions.weight,
        TRUST_FACTORS.abandonedMissions.max
    );
    if (abandonedScore < 0) {
        factors.push({ name: 'Abandoned Missions', value: abandonedMissions, impact: abandonedScore, positive: false });
        score += abandonedScore;
    }

    const lateScore = Math.max(
        lateResponses * TRUST_FACTORS.lateResponses.weight,
        TRUST_FACTORS.lateResponses.max
    );
    if (lateScore < 0) {
        factors.push({ name: 'Late Responses', value: lateResponses, impact: lateScore, positive: false });
        score += lateScore;
    }

    const negFeedbackScore = Math.max(
        negativeFeedback * TRUST_FACTORS.negativeFeedback.weight,
        TRUST_FACTORS.negativeFeedback.max
    );
    if (negFeedbackScore < 0) {
        factors.push({ name: 'Negative Feedback', value: negativeFeedback, impact: negFeedbackScore, positive: false });
        score += negFeedbackScore;
    }

    const reportedScore = Math.max(
        reportedByOthers * TRUST_FACTORS.reportedByOthers.weight,
        TRUST_FACTORS.reportedByOthers.max
    );
    if (reportedScore < 0) {
        factors.push({ name: 'Reported by Others', value: reportedByOthers, impact: reportedScore, positive: false });
        score += reportedScore;
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine trust level
    let trustLevel = TRUST_LEVELS.flagged;
    for (const [key, level] of Object.entries(TRUST_LEVELS)) {
        if (score >= level.min && level.min >= trustLevel.min) {
            trustLevel = { ...level, key };
        }
    }

    // Calculate reliability percentage
    const totalMissions = missionsCompleted + abandonedMissions;
    const reliability = totalMissions > 0
        ? Math.round((missionsCompleted / totalMissions) * 100)
        : 100;

    // Calculate response rate
    const totalResponses = onTimeResponses + lateResponses;
    const responseRate = totalResponses > 0
        ? Math.round((onTimeResponses / totalResponses) * 100)
        : 100;

    return {
        score: Math.round(score),
        level: trustLevel,
        factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
        stats: {
            reliability,
            responseRate,
            totalMissions: missionsCompleted,
            totalReports: incidentsReported,
            verificationRate: incidentsReported > 0
                ? Math.round((incidentsVerified / incidentsReported) * 100)
                : 0
        },
        recommendations: generateTrustRecommendations(userData, score)
    };
};

/**
 * Generate recommendations to improve trust score
 */
const generateTrustRecommendations = (userData, score) => {
    const recommendations = [];

    if (!userData.profileComplete) {
        recommendations.push({
            action: 'Complete your profile',
            impact: '+10 points',
            priority: 'high'
        });
    }

    if (!userData.verifiedIdentity) {
        recommendations.push({
            action: 'Verify your identity',
            impact: '+25 points',
            priority: 'high'
        });
    }

    if ((userData.missionsCompleted || 0) < 5) {
        recommendations.push({
            action: 'Complete more volunteer missions',
            impact: '+10 points per mission',
            priority: 'medium'
        });
    }

    if ((userData.abandonedMissions || 0) > 0) {
        recommendations.push({
            action: 'Complete missions once accepted',
            impact: 'Prevents -15 points penalty',
            priority: 'high'
        });
    }

    if (score < 60) {
        recommendations.push({
            action: 'Maintain consistent response times',
            impact: '+3 points per on-time response',
            priority: 'medium'
        });
    }

    return recommendations;
};

/**
 * Get trust badge for display
 */
export const getTrustBadge = (score) => {
    for (const [key, level] of Object.entries(TRUST_LEVELS)) {
        if (score >= level.min) {
            return { ...level, key };
        }
    }
    return TRUST_LEVELS.flagged;
};

/**
 * Check if user can perform action based on trust
 */
export const canPerformAction = (score, action) => {
    const actionRequirements = {
        reportIncident: 0,           // Anyone can report
        acceptMission: 20,           // Need basic trust
        respondToCritical: 60,       // Higher trust for critical
        verifyReports: 70,           // High trust to verify others
        dispatchResources: 80        // Highest trust for dispatch
    };

    const required = actionRequirements[action] || 0;
    return score >= required;
};

/**
 * Mock function to get user trust data (would connect to Firestore in production)
 */
export const getUserTrustData = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/trust`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user trust data:', error);
        // Fallback to minimal default data structure if API fails, or rethrow depending on requirement
        // For now, returning a safe default to prevent crash
        return {
            incidentsReported: 0,
            incidentsVerified: 0,
            missionsCompleted: 0,
            onTimeResponses: 0,
            positiveFeedback: 0,
            accountAgeDays: 0,
            profileComplete: false,
            verifiedIdentity: false,
            falseReports: 0,
            abandonedMissions: 0,
            lateResponses: 0,
            negativeFeedback: 0,
            reportedByOthers: 0
        };
    }
};

export default {
    calculateTrustScore,
    getTrustBadge,
    canPerformAction,
    getUserTrustData,
    TRUST_LEVELS,
    TRUST_FACTORS
};
