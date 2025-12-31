import React, { useState, useEffect } from 'react';
import {
    AlertOctagon, MapPin, Users, Truck, AlertTriangle,
    ChevronDown, ChevronUp, Radio, Shield, Zap, Activity
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import {
    detectOverloadZones,
    calculateResourceUtilization,
    generateMutualAidSuggestions,
    getSystemStatus
} from '../services/overloadDetectionService';
import './OverloadZoneAlert.css';

const OverloadZoneAlert = ({ incidents, deployedResources = {}, onZoneClick }) => {
    const [systemStatus, setSystemStatus] = useState(null);
    const [expandedZone, setExpandedZone] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (incidents && incidents.length > 0) {
            const status = getSystemStatus(incidents, deployedResources);
            setSystemStatus(status);
        }
    }, [incidents, deployedResources]);

    if (!systemStatus || systemStatus.overloadZones.length === 0) {
        return null; // No overload detected, don't show component
    }

    const getStatusColor = (status) => {
        const colors = {
            critical: '#ef4444',
            elevated: '#f59e0b',
            normal: '#10b981'
        };
        return colors[status] || '#6b7280';
    };

    const getSeverityColor = (severity) => {
        const colors = {
            critical: '#ef4444',
            high: '#f59e0b',
            elevated: '#f59e0b',
            normal: '#3b82f6'
        };
        return colors[severity] || '#6b7280';
    };

    return (
        <div className={`overload-alert system-${systemStatus.status}`}>
            {/* System Status Banner */}
            <div 
                className="system-banner"
                style={{ backgroundColor: `${getStatusColor(systemStatus.status)}15` }}
            >
                <div className="banner-left">
                    <AlertOctagon 
                        size={20} 
                        style={{ color: getStatusColor(systemStatus.status) }}
                        className={systemStatus.status === 'critical' ? 'pulse-icon' : ''}
                    />
                    <div className="banner-text">
                        <span 
                            className="status-label"
                            style={{ color: getStatusColor(systemStatus.status) }}
                        >
                            {systemStatus.status === 'critical' ? 'CRITICAL OVERLOAD' :
                             systemStatus.status === 'elevated' ? 'SYSTEM STRAIN DETECTED' :
                             'SYSTEM NORMAL'}
                        </span>
                        <span className="status-detail">
                            {systemStatus.overloadZones.length} overload zone(s) • {systemStatus.activeIncidents} active incidents
                        </span>
                    </div>
                </div>
                <button 
                    className="details-toggle"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? 'Hide' : 'Details'}
                    {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {showDetails && (
                <>
                    {/* Resource Utilization */}
                    <div className="resource-section">
                        <h4 className="section-title">
                            <Truck size={14} />
                            Resource Utilization
                        </h4>
                        <div className="resource-bars">
                            {Object.entries(systemStatus.utilization.byType).map(([type, data]) => (
                                <div key={type} className="resource-bar-item">
                                    <div className="bar-header">
                                        <span className="bar-label">
                                            {type === 'ambulance' ? '🚑' : 
                                             type === 'fire' ? '🚒' : 
                                             type === 'police' ? '🚔' : '🦺'} {type}
                                        </span>
                                        <span className={`bar-status status-${data.status}`}>
                                            {data.deployed}/{data.capacity}
                                        </span>
                                    </div>
                                    <div className="bar-track">
                                        <div 
                                            className={`bar-fill status-${data.status}`}
                                            style={{ width: `${Math.min(data.ratio * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div 
                            className="overall-status"
                            style={{ 
                                backgroundColor: `${getStatusColor(
                                    systemStatus.utilization.overall.status === 'critical' ? 'critical' :
                                    systemStatus.utilization.overall.status === 'stretched' ? 'elevated' : 'normal'
                                )}10` 
                            }}
                        >
                            <Activity size={14} />
                            <span>Overall: {Math.round(systemStatus.utilization.overall.ratio * 100)}% utilized</span>
                            <span className={`status-badge ${systemStatus.utilization.overall.status}`}>
                                {systemStatus.utilization.overall.status}
                            </span>
                        </div>
                    </div>

                    {/* Overload Zones */}
                    <div className="zones-section">
                        <h4 className="section-title">
                            <MapPin size={14} />
                            Overload Zones
                        </h4>
                        <div className="zones-list">
                            {systemStatus.overloadZones.map(zone => (
                                <div 
                                    key={zone.id}
                                    className={`zone-card severity-${zone.severity}`}
                                    onClick={() => onZoneClick?.(zone)}
                                >
                                    <div className="zone-header">
                                        <div className="zone-identity">
                                            <span 
                                                className="zone-severity"
                                                style={{ 
                                                    backgroundColor: `${getSeverityColor(zone.severity)}20`,
                                                    color: getSeverityColor(zone.severity)
                                                }}
                                            >
                                                {zone.severity === 'critical' ? '🔴' : '🟠'} {zone.severity.toUpperCase()}
                                            </span>
                                            <span className="zone-name">{zone.areaName}</span>
                                        </div>
                                        <button 
                                            className="expand-zone"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedZone(expandedZone === zone.id ? null : zone.id);
                                            }}
                                        >
                                            {expandedZone === zone.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    <div className="zone-stats">
                                        <div className="stat">
                                            <Radio size={12} />
                                            <span>{zone.incidentCount} incidents</span>
                                        </div>
                                        <div className="stat">
                                            <MapPin size={12} />
                                            <span>{zone.radius.toFixed(1)} mi radius</span>
                                        </div>
                                    </div>

                                    <div className="severity-breakdown">
                                        {zone.severityBreakdown.critical > 0 && (
                                            <span className="sev-chip critical">{zone.severityBreakdown.critical} critical</span>
                                        )}
                                        {zone.severityBreakdown.high > 0 && (
                                            <span className="sev-chip high">{zone.severityBreakdown.high} high</span>
                                        )}
                                        {zone.severityBreakdown.medium > 0 && (
                                            <span className="sev-chip medium">{zone.severityBreakdown.medium} medium</span>
                                        )}
                                    </div>

                                    {expandedZone === zone.id && (
                                        <div className="zone-expanded">
                                            {/* Required Resources */}
                                            <div className="required-resources">
                                                <h5>Required Resources</h5>
                                                <div className="resource-chips">
                                                    {Object.entries(zone.requiredResources).map(([type, count]) => 
                                                        count > 0 && (
                                                            <span key={type} className="resource-chip">
                                                                {type === 'ambulance' ? '🚑' : 
                                                                 type === 'fire' ? '🚒' : 
                                                                 type === 'police' ? '🚔' : '🦺'} 
                                                                {count} {type}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mutual Aid Suggestions */}
                                            <div className="suggestions">
                                                <h5>
                                                    <Zap size={12} />
                                                    AI Recommendations
                                                </h5>
                                                <ul>
                                                    {generateMutualAidSuggestions(zone, systemStatus.utilization).map((sug, idx) => (
                                                        <li key={idx} className={`suggestion priority-${sug.priority}`}>
                                                            <Shield size={12} />
                                                            <div>
                                                                <span className="sug-title">{sug.title}</span>
                                                                <span className="sug-action">{sug.action}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="zone-actions">
                                                <Button 
                                                    variant="primary" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onZoneClick?.(zone);
                                                    }}
                                                >
                                                    View on Map
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                >
                                                    Request Mutual Aid
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Alerts */}
                    {systemStatus.alerts.length > 0 && (
                        <div className="alerts-section">
                            <h4 className="section-title">
                                <AlertTriangle size={14} />
                                Active Alerts
                            </h4>
                            <div className="alerts-list">
                                {systemStatus.alerts.map((alert, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`alert-item severity-${alert.severity}`}
                                    >
                                        <span className="alert-type">{alert.type}</span>
                                        <span className="alert-message">{alert.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Footer */}
            <div className="alert-footer">
                <span className="footer-note">
                    <Users size={12} />
                    Disaster-scale monitoring active
                </span>
            </div>
        </div>
    );
};

export default OverloadZoneAlert;
