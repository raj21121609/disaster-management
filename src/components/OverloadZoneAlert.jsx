import React from 'react';
import { AlertTriangle, ChevronDown, MapPin, Layers } from 'lucide-react';
import classNames from 'classnames';
import './OverloadZoneAlert.css';

const OverloadZoneAlert = ({ zones = [], showDetails, onToggleDetails }) => {
    if (zones.length === 0) {
        return null;
    }

    const overallSeverity = zones.some(z => z.severity === 'critical')
        ? 'critical'
        : 'elevated';

    const alertClasses = classNames('overload-alert', `status-${overallSeverity}`);

    return (
        <div className="relative">
            <button className={alertClasses} onClick={onToggleDetails}>
                <AlertTriangle size={20} className="alert-icon" />
                <span className="alert-text">
                    {zones.length} Overload Zone{zones.length > 1 ? 's' : ''}
                </span>
                <ChevronDown
                    size={16}
                    className={`alert-chevron ${showDetails ? 'open' : ''}`}
                />
            </button>

            {showDetails && (
                <div className="overload-details">
                    <div className="details-header">
                        <h3 className="details-title">Active Overload Zones</h3>
                    </div>
                    <div className="zone-list">
                        {zones.map(zone => (
                            <div key={zone.id} className={`zone-item severity-${zone.severity}`}>
                                <div className="zone-header">
                                    <span className="zone-name">{zone.areaName}</span>
                                    <span className="zone-severity">
                                        {zone.severity}
                                    </span>
                                </div>
                                <div className="zone-stats">
                                    <div className="stat-item">
                                        <Layers size={12} />
                                        <span>{zone.incidentCount} Incidents</span>
                                    </div>
                                    <div className="stat-item">
                                        <MapPin size={12} />
                                        <span>~{(zone.radius).toFixed(1)} mi radius</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverloadZoneAlert;