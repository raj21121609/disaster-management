import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Siren, Ambulance, Shield, Clock, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import MapView from '../components/MapView';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
    subscribeToActiveIncidents,
    IncidentStatus,
    SeverityLevel
} from '../services/incidentService';
import './DashboardPage.css';

const DashboardPage = () => {
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [filter, setFilter] = useState('all');
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const { currentUser } = useAuth();
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setUserLocation({ lat: 40.7128, lng: -74.0060 });
                }
            );
        }
    }, []);

    useEffect(() => {
        setLoading(true);

        const unsubscribe = subscribeToActiveIncidents((newIncidents) => {
            const prevCriticalCount = incidents.filter(i => i.severity === 'critical').length;
            const newCriticalCount = newIncidents.filter(i => i.severity === 'critical').length;

            if (newCriticalCount > prevCriticalCount && incidents.length > 0) {
                const newCritical = newIncidents.find(i =>
                    i.severity === 'critical' &&
                    !incidents.find(prev => prev.id === i.id)
                );
                if (newCritical) {
                    addNotification({
                        type: 'incident',
                        severity: 'critical',
                        message: `New critical ${newCritical.type} incident reported`,
                        incidentId: newCritical.id
                    });
                }
            }

            setIncidents(newIncidents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [addNotification]);

    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'all') return true;
        if (filter === 'critical') return inc.severity === SeverityLevel.CRITICAL;
        if (filter === 'high') return inc.severity === SeverityLevel.HIGH;
        return true;
    });

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'critical': return 'severity-critical';
            case 'high': return 'severity-high';
            case 'medium': return 'severity-medium';
            default: return 'severity-low';
        }
    };

    const stats = {
        critical: incidents.filter(i => i.severity === 'critical').length,
        high: incidents.filter(i => i.severity === 'high').length,
        total: incidents.length
    };

    const handleIncidentClick = useCallback((incident) => {
        setSelectedIncident(incident.id);
    }, []);

    return (
        <div className="dashboard-page">
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <h2 className="text-lg font-bold">Active Incidents</h2>
                    <div className="status-badges">
                        {stats.critical > 0 && (
                            <div className="status-badge bg-emergency">{stats.critical} Critical</div>
                        )}
                        {stats.high > 0 && (
                            <div className="status-badge bg-warning">{stats.high} High</div>
                        )}
                    </div>
                </div>

                <div className="filter-bar">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={filter === 'all' ? 'active-filter' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All ({stats.total})
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={filter === 'critical' ? 'active-filter' : ''}
                        onClick={() => setFilter('critical')}
                    >
                        Critical
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={filter === 'high' ? 'active-filter' : ''}
                        onClick={() => setFilter('high')}
                    >
                        High
                    </Button>
                </div>

                <div className="incidents-list">
                    {loading ? (
                        <div className="loading-state">
                            <RefreshCw className="spin" size={24} />
                            <p>Loading incidents...</p>
                        </div>
                    ) : filteredIncidents.length === 0 ? (
                        <div className="empty-state-mini">
                            <Shield size={32} className="text-success" />
                            <p>No active incidents</p>
                        </div>
                    ) : (
                        filteredIncidents.map((inc) => (
                            <div
                                key={inc.id}
                                className={`incident-item ${selectedIncident === inc.id ? 'selected' : ''}`}
                                onClick={() => setSelectedIncident(inc.id)}
                            >
                                <div className={`severity-indicator ${getSeverityClass(inc.severity)}`}></div>
                                <div className="incident-info">
                                    <div className="incident-header">
                                        <span className="incident-type capitalize">{inc.type}</span>
                                        <span className="incident-time flex-center gap-1">
                                            <Clock size={12} /> {getTimeAgo(inc.createdAt)}
                                        </span>
                                    </div>
                                    <h4 className="incident-title">
                                        {inc.type.charAt(0).toUpperCase() + inc.type.slice(1)} Emergency
                                    </h4>
                                    <p className="incident-location">
                                        <MapPin size={12} /> {inc.address || 'Location pending...'}
                                    </p>
                                    <div className="incident-status">
                                        <span className={`status-chip status-${inc.status}`}>
                                            {inc.status.replace('_', ' ')}
                                        </span>
                                        {inc.assignedVolunteers?.length > 0 && (
                                            <span className="volunteer-count">
                                                {inc.assignedVolunteers.length} responding
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        Live Updates Active
                    </div>
                </div>
            </aside>

            <main className="map-view">
                <div className="map-header">
                    <div className="map-search-overlay">
                        <input
                            type="text"
                            placeholder="Search location or incident ID..."
                            className="map-search-input"
                        />
                    </div>
                    <div className="map-stats">
                        <div className="stat-pill">
                            <AlertTriangle size={14} className="text-emergency" />
                            {stats.critical} Critical
                        </div>
                        <div className="stat-pill">
                            <Siren size={14} className="text-warning" />
                            {stats.total} Active
                        </div>
                    </div>
                </div>

                <MapView
                    incidents={filteredIncidents}
                    onIncidentClick={handleIncidentClick}
                    selectedIncidentId={selectedIncident}
                    userLocation={userLocation}
                    showUserLocation={true}
                    center={userLocation || { lat: 40.7128, lng: -74.0060 }}
                    zoom={12}
                    height="calc(100vh - 140px)"
                />

                <div className="map-legend">
                    <div className="legend-item">
                        <span className="dot bg-emergency"></span> Critical
                    </div>
                    <div className="legend-item">
                        <span className="dot bg-warning"></span> High Priority
                    </div>
                    <div className="legend-item">
                        <span className="dot bg-info"></span> Medium
                    </div>
                    <div className="legend-item">
                        <span className="dot bg-success"></span> Low / Resolved
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
