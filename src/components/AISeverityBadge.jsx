import React from 'react';
import { Brain, Zap } from 'lucide-react';
import './AISeverityBadge.css';

const AISeverityBadge = ({ severity, priorityScore, showScore = true, size = 'md' }) => {
    const getSeverityColor = () => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getSeverityLabel = () => {
        switch (severity) {
            case 'critical': return 'CRITICAL';
            case 'high': return 'HIGH';
            case 'medium': return 'MEDIUM';
            case 'low': return 'LOW';
            default: return 'UNKNOWN';
        }
    };

    return (
        <div className={`ai-severity-badge size-${size}`} style={{ '--severity-color': getSeverityColor() }}>
            <div className="badge-header">
                <Brain size={size === 'sm' ? 12 : 16} />
                <span className="ai-label">AI Analysis</span>
                <Zap size={size === 'sm' ? 10 : 12} className="zap-icon" />
            </div>
            <div className="badge-content">
                <span 
                    className={`severity-level severity-${severity}`}
                    style={{ color: getSeverityColor() }}
                >
                    {getSeverityLabel()}
                </span>
                {showScore && priorityScore !== undefined && (
                    <div className="priority-score">
                        <span className="score-value">{priorityScore}</span>
                        <span className="score-max">/100</span>
                    </div>
                )}
            </div>
            <div className="badge-bar" style={{ width: `${priorityScore || 50}%` }}></div>
        </div>
    );
};

export default AISeverityBadge;
