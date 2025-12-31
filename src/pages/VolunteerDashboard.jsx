import React, { useState, useEffect, useCallback } from 'react';
import {
    MapPin, Navigation, Clock, CheckCircle, XCircle, Phone,
    AlertTriangle, Radio, User, Loader, RefreshCw
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import MapView from '../components/MapView';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
    subscribeToActiveIncidents,
    assignVolunteer,
    unassignVolunteer,
    updateIncidentStatus,
    getNearbyIncidents,
    IncidentStatus
} from '../services/incidentService';
import './VolunteerDashboard.css';

const VolunteerDashboard = () => {
    const [activeTab, setActiveTab] = useState('nearby');
    const [incidents, setIncidents] = useState([]);
    const [myMissions, setMyMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState(null);

    const { currentUser, getIdToken, updateVolunteerStatus, updateUserLocation } = useAuth();
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);

                    if (currentUser) {
                        updateUserLocation(location.lat, location.lng);
                    }
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setUserLocation({ lat: 40.7128, lng: -74.0060 });
                },
                { enableHighAccuracy: true, maximumAge: 30000 }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [currentUser, updateUserLocation]);

    useEffect(() => {
        setLoading(true);

        const unsubscribe = subscribeToActiveIncidents((allIncidents) => {
            if (userLocation) {
                const nearby = getNearbyIncidents(
                    allIncidents,
                    userLocation.lat,
                    userLocation.lng,
                    15
                );
                setIncidents(nearby);
            } else {
                setIncidents(allIncidents);
            }

            if (currentUser) {
                const missions = allIncidents.filter(inc =>
                    inc.assignedVolunteers?.includes(currentUser.uid)
                );
                setMyMissions(missions);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [userLocation, currentUser]);

    const handleAcceptMission = async (incident) => {
        if (!currentUser) {
            addNotification({
                type: 'error',
                severity: 'high',
                message: 'Please sign in to accept missions'
            });
            return;
        }

        setAcceptingId(incident.id);

        try {
            await assignVolunteer(incident.id, currentUser.uid);

            addNotification({
                type: 'success',
                severity: 'low',
                message: `Mission accepted: ${incident.type} emergency`
            });

            setActiveTab('assigned');
        } catch (error) {
            console.error('Failed to accept mission:', error);
            addNotification({
                type: 'error',
                severity: 'high',
                message: 'Failed to accept mission. Please try again.'
            });
        } finally {
            setAcceptingId(null);
        }
    };

    const handleUpdateStatus = async (incident, newStatus) => {
        try {
            const idToken = await getIdToken();
            await updateIncidentStatus(incident.id, newStatus, currentUser.uid, idToken);

            addNotification({
                type: 'success',
                severity: 'low',
                message: `Status updated to: ${newStatus.replace('_', ' ')}`
            });
        } catch (error) {
            console.error('Failed to update status:', error);
            addNotification({
                type: 'error',
                severity: 'high',
                message: 'Failed to update status'
            });
        }
    };

    const handleDropMission = async (incident) => {
        try {
            await unassignVolunteer(incident.id, currentUser.uid);

            addNotification({
                type: 'info',
                severity: 'low',
                message: 'Mission dropped'
            });
        } catch (error) {
            console.error('Failed to drop mission:', error);
        }
    };

    const toggleOnlineStatus = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);

        if (currentUser) {
            await updateVolunteerStatus(newStatus);
        }

        addNotification({
            type: 'info',
            severity: 'low',
            message: newStatus ? 'You are now on call' : 'You are now offline'
        });
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

    const getPriorityBadge = (severity) => {
        const colors = {
            critical: 'bg-emergency',
            high: 'bg-warning',
            medium: 'bg-info',
            low: 'bg-success'
        };
        return colors[severity] || 'bg-info';
    };

    const nearbyIncidents = incidents.filter(inc =>
        !inc.assignedVolunteers?.includes(currentUser?.uid)
    );

    return (
        <div className="volunteer-dashboard">
            <div className="dashboard-header-bar">
                <div className="header-left">
                    <h1 className="text-2xl font-bold">Volunteer Command</h1>
                    <p className="text-secondary text-sm">Help your community</p>
                </div>
                <div className="header-right">
                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                        <span className="status-dot"></span>
                        {isOnline ? 'On Call' : 'Offline'}
                    </div>
                    <Button
                        variant={isOnline ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={toggleOnlineStatus}
                    >
                        {isOnline ? 'Go Offline' : 'Go Online'}
                    </Button>
                </div>
            </div>

            <div className="volunteer-content">
                <div className="volunteer-sidebar">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === 'nearby' ? 'active' : ''}`}
                            onClick={() => setActiveTab('nearby')}
                        >
                            <Radio size={16} />
                            Nearby ({nearbyIncidents.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
                            onClick={() => setActiveTab('assigned')}
                        >
                            <CheckCircle size={16} />
                            My Missions ({myMissions.length})
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <Loader className="spin" size={32} />
                            <p>Finding nearby incidents...</p>
                        </div>
                    ) : activeTab === 'nearby' ? (
                        <div className="tasks-list">
                            {nearbyIncidents.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <CheckCircle size={48} className="text-success" />
                                    </div>
                                    <h3>All Clear</h3>
                                    <p className="text-muted">No incidents nearby. Stay ready!</p>
                                </div>
                            ) : (
                                nearbyIncidents.map(incident => (
                                    <Card
                                        key={incident.id}
                                        className={`task-card ${selectedIncident === incident.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedIncident(incident.id)}
                                    >
                                        <div className="task-header">
                                            <div className={`task-badge ${getPriorityBadge(incident.severity)}`}>
                                                {incident.severity} Priority
                                            </div>
                                            <span className="task-time text-muted text-xs">
                                                {getTimeAgo(incident.createdAt)}
                                            </span>
                                        </div>

                                        <h3 className="task-title">
                                            {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Emergency
                                        </h3>

                                        {incident.description && (
                                            <p className="task-description">
                                                {incident.description.substring(0, 80)}
                                                {incident.description.length > 80 ? '...' : ''}
                                            </p>
                                        )}

                                        <div className="task-details">
                                            <div className="detail-item">
                                                <MapPin size={16} className="text-muted" />
                                                <span>{incident.address || 'Location available'}</span>
                                            </div>
                                            {incident.distance !== undefined && (
                                                <div className="detail-item">
                                                    <Navigation size={16} className="text-info" />
                                                    <span>{incident.distance.toFixed(1)} mi away</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-actions">
                                            <Button
                                                variant="primary"
                                                className="flex-1"
                                                icon={CheckCircle}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAcceptMission(incident);
                                                }}
                                                disabled={acceptingId === incident.id}
                                            >
                                                {acceptingId === incident.id ? 'Accepting...' : 'Accept Mission'}
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="tasks-list">
                            {myMissions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <User size={48} className="text-muted" />
                                    </div>
                                    <h3>No Active Missions</h3>
                                    <p className="text-muted">Accept a mission from the Nearby tab</p>
                                </div>
                            ) : (
                                myMissions.map(mission => (
                                    <Card
                                        key={mission.id}
                                        className={`task-card active-mission ${selectedIncident === mission.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedIncident(mission.id)}
                                    >
                                        <div className="task-header">
                                            <div className={`task-badge ${getPriorityBadge(mission.severity)}`}>
                                                {mission.severity}
                                            </div>
                                            <span className={`mission-status status-${mission.status}`}>
                                                {mission.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <h3 className="task-title">
                                            {mission.type.charAt(0).toUpperCase() + mission.type.slice(1)} Emergency
                                        </h3>

                                        <div className="task-details">
                                            <div className="detail-item">
                                                <MapPin size={16} className="text-muted" />
                                                <span>{mission.address || 'Location available'}</span>
                                            </div>
                                            {mission.contactPhone && (
                                                <div className="detail-item">
                                                    <Phone size={16} className="text-info" />
                                                    <a href={`tel:${mission.contactPhone}`}>{mission.contactPhone}</a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mission-actions">
                                            {mission.status === IncidentStatus.ASSIGNED && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(mission, IncidentStatus.ON_THE_WAY);
                                                    }}
                                                >
                                                    On My Way
                                                </Button>
                                            )}
                                            {mission.status === IncidentStatus.ON_THE_WAY && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(mission, IncidentStatus.IN_PROGRESS);
                                                    }}
                                                >
                                                    Arrived
                                                </Button>
                                            )}
                                            {mission.status === IncidentStatus.IN_PROGRESS && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    icon={CheckCircle}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(mission, IncidentStatus.RESOLVED);
                                                    }}
                                                >
                                                    Mark Resolved
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDropMission(mission);
                                                }}
                                            >
                                                Drop
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="volunteer-map">
                    <MapView
                        incidents={activeTab === 'nearby' ? nearbyIncidents : myMissions}
                        onIncidentClick={(inc) => setSelectedIncident(inc.id)}
                        selectedIncidentId={selectedIncident}
                        userLocation={userLocation}
                        showUserLocation={true}
                        center={userLocation || { lat: 40.7128, lng: -74.0060 }}
                        zoom={13}
                        height="100%"
                    />
                </div>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
