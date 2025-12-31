import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, Clock, Users, Building, Shield,
    ChevronUp, Pause, Play, TrendingUp, Bell
} from 'lucide-react';
import {
    getEscalationTimeline,
    getEscalationActions,
    needsImmediateAttention,
    ESCALATION_LEVELS
} from '../services/escalationService';
import './EscalationTimeline.css';

const EscalationTimeline = ({ incident, compact = false }) => {
    const [escalation, setEscalation] = useState(null);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        if (incident) {
            const updateEscalation = () => {
                setEscalation(getEscalationTimeline(incident));
            };
            
            updateEscalation();
            
            // Update every 30 seconds
            const interval = setInterval(updateEscalation, 30000);
            return () => clearInterval(interval);
        }
    }, [incident]);

    if (!escalation) return null;

    const { 
        timeline, 
        currentLevel, 
        currentLevelInfo,
        escalationPaused, 
        pauseReason,
        elapsedMinutes, 
        nextEscalation,
        urgencyScore 
    } = escalation;

    const needsAttention = needsImmediateAttention(incident);

    if (compact) {
        return (
            <div className={`escalation-compact ${needsAttention ? 'urgent' : ''}`}>
                <div 
                    className="compact-badge"
                    style={{ 
                        backgroundColor: `${currentLevelInfo?.color}20`,
                        borderColor: currentLevelInfo?.color
                    }}
                >
                    <span className="badge-icon">{currentLevelInfo?.icon}</span>
                    <span className="badge-text" style={{ color: currentLevelInfo?.color }}>
                        Level {currentLevel}
                    </span>
                    {escalationPaused && <Pause size={12} className="pause-icon" />}
                </div>
                {nextEscalation && !escalationPaused && (
                    <span className="next-escalation">
                        ↑ {nextEscalation.inMinutes}m
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`escalation-timeline ${needsAttention ? 'urgent' : ''}`}>
            {/* Header */}
            <div className="escalation-header">
                <div className="header-left">
                    <TrendingUp size={18} className="text-warning" />
                    <span className="header-title">Escalation Ladder</span>
                </div>
                <div className="header-right">
                    <div className="urgency-meter">
                        <span className="urgency-label">Urgency</span>
                        <div className="urgency-bar">
                            <div 
                                className="urgency-fill"
                                style={{ 
                                    width: `${urgencyScore}%`,
                                    backgroundColor: urgencyScore > 70 ? '#ef4444' : 
                                                    urgencyScore > 40 ? '#f59e0b' : '#3b82f6'
                                }}
                            ></div>
                        </div>
                        <span className="urgency-value">{urgencyScore}</span>
                    </div>
                </div>
            </div>

            {/* Status Banner */}
            {escalationPaused ? (
                <div className="status-banner paused">
                    <Pause size={14} />
                    <span>Escalation paused: {pauseReason}</span>
                </div>
            ) : needsAttention ? (
                <div className="status-banner urgent">
                    <AlertTriangle size={14} />
                    <span>Immediate attention required!</span>
                </div>
            ) : null}

            {/* Current Level Display */}
            <div 
                className="current-level"
                style={{ borderColor: currentLevelInfo?.color }}
            >
                <div className="level-icon-large" style={{ backgroundColor: `${currentLevelInfo?.color}20` }}>
                    <span style={{ fontSize: '24px' }}>{currentLevelInfo?.icon}</span>
                </div>
                <div className="level-info">
                    <div className="level-header">
                        <span className="level-number" style={{ color: currentLevelInfo?.color }}>
                            Level {currentLevel}
                        </span>
                        <span className="level-name">{currentLevelInfo?.name}</span>
                    </div>
                    <p className="level-description">{currentLevelInfo?.description}</p>
                </div>
                <div className="level-time">
                    <Clock size={14} />
                    <span>{elapsedMinutes}m elapsed</span>
                </div>
            </div>

            {/* Next Escalation */}
            {nextEscalation && !escalationPaused && (
                <div className="next-escalation-banner">
                    <ChevronUp size={16} className="pulse-arrow" />
                    <span>
                        Escalating to <strong>{nextEscalation.name}</strong> in{' '}
                        <strong>{nextEscalation.inMinutes} minutes</strong>
                    </span>
                </div>
            )}

            {/* Timeline */}
            <div className="timeline-container">
                {timeline.map((level, idx) => (
                    <div 
                        key={level.level}
                        className={`timeline-item ${level.status}`}
                    >
                        <div 
                            className="timeline-marker"
                            style={{ 
                                backgroundColor: level.isReached ? level.color : 'transparent',
                                borderColor: level.color
                            }}
                        >
                            {level.isPaused ? (
                                <Pause size={10} />
                            ) : level.isReached ? (
                                <span className="marker-icon">{level.icon}</span>
                            ) : (
                                <span className="marker-number">{level.level}</span>
                            )}
                        </div>
                        
                        {idx < timeline.length - 1 && (
                            <div 
                                className="timeline-line"
                                style={{ 
                                    backgroundColor: level.isReached 
                                        ? level.color 
                                        : 'rgba(255,255,255,0.1)'
                                }}
                            ></div>
                        )}
                        
                        <div className="timeline-content">
                            <div className="timeline-header">
                                <span 
                                    className="timeline-title"
                                    style={{ color: level.isReached ? level.color : '#64748b' }}
                                >
                                    {level.name}
                                </span>
                                <span className="timeline-threshold">
                                    {level.threshold}m
                                </span>
                            </div>
                            <div className="timeline-role">{level.role}</div>
                            {level.isCurrent && (
                                <div className="current-indicator">
                                    <Bell size={10} />
                                    Active
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions Button */}
            <button 
                className="actions-toggle"
                onClick={() => setShowActions(!showActions)}
            >
                {showActions ? 'Hide' : 'View'} Level {currentLevel} Actions
                <ChevronUp 
                    size={14} 
                    className={showActions ? 'rotated' : ''}
                />
            </button>

            {/* Actions List */}
            {showActions && (
                <div className="actions-list">
                    <h4>Active Actions (Level {currentLevel})</h4>
                    <ul>
                        {getEscalationActions(currentLevel).map((action, idx) => (
                            <li key={idx}>
                                <Shield size={12} style={{ color: currentLevelInfo?.color }} />
                                {action}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Footer */}
            <div className="escalation-footer">
                <span className="severity-tag" style={{ 
                    backgroundColor: incident.severity === 'critical' ? '#ef444420' : 
                                    incident.severity === 'high' ? '#f59e0b20' : '#3b82f620',
                    color: incident.severity === 'critical' ? '#ef4444' : 
                           incident.severity === 'high' ? '#f59e0b' : '#3b82f6'
                }}>
                    {incident.severity?.toUpperCase()} severity timing
                </span>
            </div>
        </div>
    );
};

export default EscalationTimeline;
