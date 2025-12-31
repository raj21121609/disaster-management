import React from 'react';
import { AlertTriangle, Flame, HeartPulse, Shield } from 'lucide-react';
import './IncidentMarker.css';

const IncidentMarker = ({ type, severity, onClick, style }) => {
    const getIcon = () => {
        switch (type) {
            case 'fire': return Flame;
            case 'medical': return HeartPulse;
            case 'police': return Shield;
            default: return AlertTriangle;
        }
    };

    const getColor = () => {
        switch (severity) {
            case 'critical': return 'var(--color-emergency)';
            case 'high': return 'var(--color-warning)';
            case 'resolved': return 'var(--color-success)';
            default: return 'var(--color-info)';
        }
    };

    const Icon = getIcon();

    return (
        <div
            className={`incident-marker severity-${severity}`}
            style={{ ...style, '--marker-color': getColor() }}
            onClick={onClick}
        >
            <div className="marker-pulse"></div>
            <div className="marker-icon">
                <Icon size={16} color="white" />
            </div>
            <div className="marker-tooltip">
                <span className="capitalize">{type}</span>
            </div>
        </div>
    );
};

export default IncidentMarker;
