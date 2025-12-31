import React, { useState, useEffect } from 'react';
import {
    Shield, Star, TrendingUp, TrendingDown, Award, 
    AlertCircle, CheckCircle, Clock, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    calculateTrustScore,
    getUserTrustData,
    TRUST_LEVELS
} from '../services/trustScoreService';
import './TrustScoreBadge.css';

// Compact badge for lists and cards
export const TrustBadge = ({ score, size = 'md', showScore = true }) => {
    const getLevel = () => {
        for (const [key, level] of Object.entries(TRUST_LEVELS)) {
            if (score >= level.min) {
                return { ...level, key };
            }
        }
        return TRUST_LEVELS.flagged;
    };

    const level = getLevel();

    return (
        <div 
            className={`trust-badge size-${size}`}
            style={{ 
                backgroundColor: `${level.color}15`,
                borderColor: `${level.color}40`
            }}
        >
            <span className="badge-icon">{level.icon}</span>
            <span className="badge-label" style={{ color: level.color }}>
                {level.label}
            </span>
            {showScore && (
                <span className="badge-score" style={{ color: level.color }}>
                    {score}
                </span>
            )}
        </div>
    );
};

// Full trust score panel with breakdown
const TrustScoreBadge = ({ userId, userData: externalData, compact = false }) => {
    const [trustData, setTrustData] = useState(null);
    const [trustScore, setTrustScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const loadTrustData = async () => {
            setLoading(true);
            try {
                const data = externalData || await getUserTrustData(userId);
                setTrustData(data);
                const score = calculateTrustScore(data);
                setTrustScore(score);
            } catch (error) {
                console.error('Failed to load trust data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId || externalData) {
            loadTrustData();
        }
    }, [userId, externalData]);

    if (loading) {
        return (
            <div className="trust-score-badge loading">
                <div className="loading-spinner"></div>
                <span>Calculating trust score...</span>
            </div>
        );
    }

    if (!trustScore) return null;

    if (compact) {
        return <TrustBadge score={trustScore.score} />;
    }

    return (
        <div className="trust-score-badge">
            {/* Header */}
            <div className="trust-header">
                <div className="header-left">
                    <Shield size={18} style={{ color: trustScore.level.color }} />
                    <span className="header-title">Community Trust Score</span>
                </div>
                <div 
                    className="trust-level-badge"
                    style={{ 
                        backgroundColor: `${trustScore.level.color}20`,
                        color: trustScore.level.color
                    }}
                >
                    {trustScore.level.icon} {trustScore.level.label}
                </div>
            </div>

            {/* Score Display */}
            <div className="score-display">
                <div className="score-circle" style={{ '--score-color': trustScore.level.color }}>
                    <svg viewBox="0 0 100 100">
                        <circle 
                            className="score-bg" 
                            cx="50" cy="50" r="45"
                        />
                        <circle 
                            className="score-fill" 
                            cx="50" cy="50" r="45"
                            style={{ 
                                strokeDasharray: `${trustScore.score * 2.83} 283`,
                                stroke: trustScore.level.color
                            }}
                        />
                    </svg>
                    <div className="score-value">
                        <span className="score-number">{trustScore.score}</span>
                        <span className="score-max">/100</span>
                    </div>
                </div>

                <div className="score-stats">
                    <div className="stat-item">
                        <Target size={14} />
                        <span className="stat-label">Reliability</span>
                        <span className="stat-value">{trustScore.stats.reliability}%</span>
                    </div>
                    <div className="stat-item">
                        <Clock size={14} />
                        <span className="stat-label">Response Rate</span>
                        <span className="stat-value">{trustScore.stats.responseRate}%</span>
                    </div>
                    <div className="stat-item">
                        <CheckCircle size={14} />
                        <span className="stat-label">Missions</span>
                        <span className="stat-value">{trustScore.stats.totalMissions}</span>
                    </div>
                    <div className="stat-item">
                        <Star size={14} />
                        <span className="stat-label">Verified Reports</span>
                        <span className="stat-value">{trustScore.stats.verificationRate}%</span>
                    </div>
                </div>
            </div>

            {/* Expand/Collapse Button */}
            <button 
                className="expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? 'Hide Details' : 'View Breakdown'}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="trust-details">
                    {/* Factors Breakdown */}
                    <div className="factors-section">
                        <h4>Trust Factors</h4>
                        <div className="factors-list">
                            {trustScore.factors.map((factor, idx) => (
                                <div 
                                    key={idx} 
                                    className={`factor-item ${factor.positive ? 'positive' : 'negative'}`}
                                >
                                    <div className="factor-info">
                                        {factor.positive ? (
                                            <TrendingUp size={14} className="text-success" />
                                        ) : (
                                            <TrendingDown size={14} className="text-error" />
                                        )}
                                        <span className="factor-name">{factor.name}</span>
                                        <span className="factor-value">({factor.value})</span>
                                    </div>
                                    <span className={`factor-impact ${factor.positive ? 'positive' : 'negative'}`}>
                                        {factor.positive ? '+' : ''}{factor.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    {trustScore.recommendations.length > 0 && (
                        <div className="recommendations-section">
                            <h4>How to Improve</h4>
                            <ul className="recommendations-list">
                                {trustScore.recommendations.map((rec, idx) => (
                                    <li key={idx} className={`rec-item priority-${rec.priority}`}>
                                        <AlertCircle size={14} />
                                        <div className="rec-content">
                                            <span className="rec-action">{rec.action}</span>
                                            <span className="rec-impact">{rec.impact}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="trust-footer">
                <Award size={12} />
                <span>Trust score builds accountability and prevents false reports</span>
            </div>
        </div>
    );
};

export default TrustScoreBadge;
