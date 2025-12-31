import React, { useState, useEffect } from 'react';
import {
    Activity, Truck, Users, Clock, AlertTriangle,
    MapPin, CheckCircle, RefreshCw, Shield, Brain
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import MapView from '../components/MapView';
import AIPredictionPanel from '../components/AIPredictionPanel';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
    subscribeToIncidents,
    updateIncidentStatus,
    assignResource,
    IncidentStatus
} from '../services/incidentService';
import { getSystemStatus } from '../services/overloadDetectionService';
import OverloadZoneAlert from '../components/OverloadZoneAlert';
import './AgencyDashboard.css';

const AgencyDashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedIncidentData, setSelectedIncidentData] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(true);
    const [overloadZones, setOverloadZones] = useState([]);
    const [systemStatus, setSystemStatus] = useState('normal');
    const [showOverloadDetails, setShowOverloadDetails] = useState(false);

    const { currentUser, getIdToken } = useAuth();
    const { addNotification } = useNotifications();

    const resources = [
        { id: 'AMB-101', type: 'ambulance', status: 'available', label: 'Ambulance 101' },
        { id: 'AMB-102', type: 'ambulance', status: 'busy', label: 'Ambulance 102' },
        { id: 'FD-201', type: 'fire', status: 'available', label: 'Fire Engine 201' },
        { id: 'FD-202', type: 'fire', status: 'available', label: 'Fire Engine 202' },
        { id: 'PD-301', type: 'police', status: 'available', label: 'Police Unit 301' },
        { id: 'PD-302', type: 'police', status: 'busy', label: 'Police Unit 302' },
        { id: 'PD-303', type: 'police', status: 'available', label: 'Police Unit 303' },
    ];

    useEffect(() => {
        setLoading(true);

        const unsubscribe = subscribeToIncidents((allIncidents) => {
            setIncidents(allIncidents);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!incidents || incidents.length === 0) {
            setSystemStatus('normal');
            setOverloadZones([]);
            return;
        }

        // Simulate deployed resources based on busy status
        const deployedResources = {
            ambulance: resources.filter(r => r.type === 'ambulance' && r.status === 'busy').length,
            fire: resources.filter(r => r.type === 'fire' && r.status === 'busy').length,
            police: resources.filter(r => r.type === 'police' && r.status === 'busy').length,
        };

        const statusReport = getSystemStatus(incidents, deployedResources);

        setSystemStatus(statusReport.status);
        setOverloadZones(statusReport.overloadZones);

        if (statusReport.status === 'critical' || statusReport.status === 'elevated') {
            setShowOverloadDetails(true);
        }
    }, [incidents]);

    const filteredIncidents = incidents.filter(inc => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') {
            return [IncidentStatus.REPORTED, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS, IncidentStatus.ON_THE_WAY].includes(inc.status);
        }
        return inc.status === filterStatus;
    });

    const handleStatusUpdate = async (incidentId, newStatus) => {
        try {
            const idToken = await getIdToken();
            await updateIncidentStatus(incidentId, newStatus, currentUser?.uid, idToken);

            addNotification({
                type: 'success',
                severity: 'low',
                message: `Incident status updated to ${newStatus}`
            });
        } catch (error) {
            console.error('Failed to update status:', error);
            addNotification({
                type: 'error',
                severity: 'high',
                message: 'Failed to update incident status'
            });
        }
    };

    const handleAssignResource = async (incidentId, resource) => {
        try {
            await assignResource(incidentId, resource.id, resource.type);

            addNotification({
                type: 'success',
                severity: 'low',
                message: `${resource.label} assigned to incident`
            });

            setShowAssignModal(false);
        } catch (error) {
            console.error('Failed to assign resource:', error);
            addNotification({
                type: 'error',
                severity: 'high',
                message: 'Failed to assign resource'
            });
        }
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const getPriorityLevel = (severity, createdAt) => {
        const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
        const base = severityScore[severity] || 1;

        if (!createdAt) return `P${5 - base}`;

        const age = (Date.now() - (createdAt.toDate?.() || new Date(createdAt)).getTime()) / 60000;
        if (age > 30 && severity === 'critical') return 'P1+';

        return `P${5 - base}`;
    };

    const availableResources = resources.filter(r => r.status === 'available');
    const busyResources = resources.filter(r => r.status === 'busy');

    const activeIncidents = incidents.filter(inc =>
        [IncidentStatus.REPORTED, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS, IncidentStatus.ON_THE_WAY].includes(inc.status)
    );

    const criticalIncidents = incidents.filter(inc => inc.severity === 'critical' && inc.status !== IncidentStatus.RESOLVED);

    return (
        <div className="agency-dashboard">
            <div className="agency-header">
                <div className="header-left">
                    <h1 className="text-2xl font-bold">Agency Command Center</h1>
                    <div className="system-status">
                        <span className={`pulsing-dot bg-${systemStatus === 'critical' ? 'emergency' : systemStatus === 'elevated' ? 'warning' : 'success'}`}></span>
                        System {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
                    </div>
                </div>
                <div className="header-right">
                    {overloadZones.length > 0 && (
                        <OverloadZoneAlert
                            zones={overloadZones}
                            showDetails={showOverloadDetails}
                            onToggleDetails={() => setShowOverloadDetails(!showOverloadDetails)}
                        />
                    )}
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Active Incidents</span>
                        <Activity size={16} className="text-emergency" />
                    </div>
                    <div className="stat-value">{activeIncidents.length}</div>
                    <div className="stat-trend text-emergency">
                        {criticalIncidents.length} critical
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Avg Response Time</span>
                        <Clock size={16} className="text-warning" />
                    </div>
                    <div className="stat-value">4.2m</div>
                    <div className="stat-trend text-success">Target: 5m</div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Available Units</span>
                        <Truck size={16} className="text-info" />
                    </div>
                    <div className="stat-value">{availableResources.length}/{resources.length}</div>
                    <div className="stat-trend text-muted">
                        {busyResources.length} deployed
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Resolved Today</span>
                        <CheckCircle size={16} className="text-success" />
                    </div>
                    <div className="stat-value">{incidents.filter(i => i.status === 'resolved').length}</div>
                    <div className="stat-trend text-success">
                        {incidents.length} total incidents
                    </div>
                </Card>
            </div>

            <div className="agency-content">
                <div className="incident-panel">
                    <div className="panel-header">
                        <h3 className="section-title">Priority Queue</h3>
                        <div className="filter-dropdown">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="reported">Reported</option>
                                <option value="assigned">Assigned</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <div className="queue-list">
                        {loading ? (
                            <div className="loading-state">
                                <RefreshCw className="spin" size={24} />
                                <p>Loading incidents...</p>
                            </div>
                        ) : filteredIncidents.length === 0 ? (
                            <div className="empty-state">
                                <Shield size={48} className="text-success" />
                                <p>No incidents matching filter</p>
                            </div>
                        ) : (
                            filteredIncidents.slice(0, 20).map(incident => (
                                <div
                                    key={incident.id}
                                    className={`queue-item ${selectedIncident === incident.id ? 'selected' : ''} severity-${incident.severity}`}
                                    onClick={() => setSelectedIncident(incident.id)}
                                >
                                    <div className={`queue-priority priority-${incident.severity}`}>
                                        {getPriorityLevel(incident.severity, incident.createdAt)}
                                    </div>
                                    <div className="queue-info">
                                        <div className="queue-title">
                                            {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Emergency
                                        </div>
                                        <div className="queue-meta">
                                            <MapPin size={12} />
                                            {incident.address?.substring(0, 30) || 'Location pending'}
                                            <span className="meta-separator">•</span>
                                            {getTimeAgo(incident.createdAt)}
                                        </div>
                                    </div>
                                    <div className="queue-actions">
                                        <span className={`queue-status status-${incident.status}`}>
                                            {incident.status.replace('_', ' ')}
                                        </span>
                                        {incident.status === IncidentStatus.REPORTED && (
                                            <Button
                                                variant="primary"
                                                size="xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIncident(incident.id);
                                                    setShowAssignModal(true);
                                                }}
                                            >
                                                Dispatch
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="map-panel">
                    <MapView
                        incidents={filteredIncidents}
                        onIncidentClick={(inc) => {
                            setSelectedIncident(inc.id);
                            setSelectedIncidentData(inc);
                        }}
                        selectedIncidentId={selectedIncident}
                        showUserLocation={false}
                        center={{ lat: 40.7128, lng: -74.0060 }}
                        zoom={11}
                        height="100%"
                        overloadZones={overloadZones}
                    />
                </div>

                {showAIPanel && (
                    <div className="ai-panel">
                        <div className="ai-panel-header">
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Brain}
                                onClick={() => setShowAIPanel(!showAIPanel)}
                            >
                                AI Predictions
                            </Button>
                        </div>
                        {selectedIncidentData ? (
                            <AIPredictionPanel incident={selectedIncidentData} />
                        ) : (
                            <div className="ai-panel-empty">
                                <Brain size={48} className="text-muted" />
                                <p>Select an incident to view AI predictions</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="resource-panel">
                    <h3 className="section-title">Resource Status</h3>

                    <div className="resource-stats">
                        <div className="resource-stat">
                            <div className="resource-bar">
                                <div className="bar-label">Ambulance</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill bg-emergency"
                                        style={{ width: `${(resources.filter(r => r.type === 'ambulance' && r.status === 'busy').length / resources.filter(r => r.type === 'ambulance').length) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="bar-value">
                                    {resources.filter(r => r.type === 'ambulance' && r.status === 'busy').length}/
                                    {resources.filter(r => r.type === 'ambulance').length}
                                </div>
                            </div>
                        </div>
                        <div className="resource-stat">
                            <div className="resource-bar">
                                <div className="bar-label">Fire</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill bg-warning"
                                        style={{ width: `${(resources.filter(r => r.type === 'fire' && r.status === 'busy').length / resources.filter(r => r.type === 'fire').length) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="bar-value">
                                    {resources.filter(r => r.type === 'fire' && r.status === 'busy').length}/
                                    {resources.filter(r => r.type === 'fire').length}
                                </div>
                            </div>
                        </div>
                        <div className="resource-stat">
                            <div className="resource-bar">
                                <div className="bar-label">Police</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill bg-info"
                                        style={{ width: `${(resources.filter(r => r.type === 'police' && r.status === 'busy').length / resources.filter(r => r.type === 'police').length) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="bar-value">
                                    {resources.filter(r => r.type === 'police' && r.status === 'busy').length}/
                                    {resources.filter(r => r.type === 'police').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="resource-list">
                        <h4 className="sub-title">Available Units</h4>
                        {availableResources.map(resource => (
                            <div key={resource.id} className="resource-item available">
                                <div className="resource-icon">
                                    {resource.type === 'ambulance' && '🚑'}
                                    {resource.type === 'fire' && '🚒'}
                                    {resource.type === 'police' && '🚔'}
                                </div>
                                <div className="resource-details">
                                    <span className="resource-name">{resource.label}</span>
                                    <span className="resource-id">{resource.id}</span>
                                </div>
                                <span className="resource-status available">Ready</span>
                            </div>
                        ))}
                    </div>

                    {criticalIncidents.length > 0 && (
                        <Card className="alert-box mt-4">
                            <div className="flex items-center gap-2 text-emergency mb-2">
                                <AlertTriangle size={18} />
                                <span className="font-bold">Critical Alert</span>
                            </div>
                            <p className="text-sm text-secondary">
                                {criticalIncidents.length} critical incident{criticalIncidents.length > 1 ? 's' : ''} require immediate attention
                            </p>
                        </Card>
                    )}
                </div>
            </div>

            {showAssignModal && selectedIncident && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Dispatch Resource</h3>
                            <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary mb-4">Select a resource to dispatch:</p>
                            <div className="dispatch-options">
                                {availableResources.map(resource => (
                                    <button
                                        key={resource.id}
                                        className="dispatch-option"
                                        onClick={() => handleAssignResource(selectedIncident, resource)}
                                    >
                                        <span className="dispatch-icon">
                                            {resource.type === 'ambulance' && '🚑'}
                                            {resource.type === 'fire' && '🚒'}
                                            {resource.type === 'police' && '🚔'}
                                        </span>
                                        <span className="dispatch-label">{resource.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyDashboard;
