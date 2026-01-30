import React, { useState, useEffect } from 'react';
import {
    MapPin, Navigation, Clock, CheckCircle, XCircle, Phone,
    AlertTriangle, Radio, User, Loader, RefreshCw, Shield, Bell
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Alert } from '../components/ui/Alert';
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
import { cn } from '../lib/utils';
// import './VolunteerDashboard.css'; // REMOVED

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
                    if (currentUser) updateUserLocation(location.lat, location.lng);
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
                const nearby = getNearbyIncidents(allIncidents, userLocation.lat, userLocation.lng, 15);
                setIncidents(nearby);
            } else {
                setIncidents(allIncidents);
            }

            if (currentUser) {
                const missions = allIncidents.filter(inc => inc.assignedVolunteers?.includes(currentUser.uid));
                setMyMissions(missions);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userLocation, currentUser]);

    const handleAcceptMission = async (incident) => {
        if (!currentUser) return;
        setAcceptingId(incident.id);
        try {
            await assignVolunteer(incident.id, currentUser.uid);
            addNotification({ type: 'success', severity: 'low', message: `Mission accepted: ${incident.type}` });
            setActiveTab('assigned');
        } catch (error) {
            console.error('Failed to accept:', error);
            addNotification({ type: 'error', severity: 'high', message: 'Failed to accept mission' });
        } finally {
            setAcceptingId(null);
        }
    };

    const handleUpdateStatus = async (incident, newStatus) => {
        try {
            const idToken = await getIdToken();
            await updateIncidentStatus(incident.id, newStatus, currentUser.uid, idToken);
            addNotification({ type: 'success', severity: 'low', message: `Status: ${newStatus.replace('_', ' ')}` });
        } catch (error) {
            console.error('Failed to update:', error);
            addNotification({ type: 'error', severity: 'high', message: 'Failed to update status' });
        }
    };

    const handleDropMission = async (incident) => {
        try {
            await unassignVolunteer(incident.id, currentUser.uid);
            addNotification({ type: 'info', severity: 'low', message: 'Mission dropped' });
        } catch (error) {
            console.error('Failed to drop:', error);
        }
    };

    const toggleOnlineStatus = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        if (currentUser) await updateVolunteerStatus(newStatus);
        addNotification({ type: 'info', severity: 'low', message: newStatus ? 'You are on call' : 'You are offline' });
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const nearbyIncidents = incidents.filter(inc => !inc.assignedVolunteers?.includes(currentUser?.uid));

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <div className="w-96 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur z-20">
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-slate-100 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            VOLUNTEER COMMS
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-500")}></span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{isOnline ? "ON CALL" : "OFFLINE"}</span>
                        </div>
                    </div>
                    <Button
                        variant={isOnline ? "outline" : "primary"}
                        className="w-full h-8 text-xs"
                        onClick={toggleOnlineStatus}
                    >
                        {isOnline ? "GO OFFLINE" : "GO ONLINE"}
                    </Button>
                </div>

                <div className="p-2">
                    <div className="flex gap-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800">
                        <button
                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === 'nearby' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
                            onClick={() => setActiveTab('nearby')}
                        >
                            NEARBY ({nearbyIncidents.length})
                        </button>
                        <button
                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === 'assigned' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
                            onClick={() => setActiveTab('assigned')}
                        >
                            MISSIONS ({myMissions.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <Loader className="animate-spin mb-2" size={24} />
                            <p className="text-xs">Scanning frequencies...</p>
                        </div>
                    ) : activeTab === 'nearby' ? (
                        nearbyIncidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-dashed border-slate-800 rounded-lg m-2">
                                <CheckCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">All Clear</p>
                                <p className="text-xs">No incidents in your sector.</p>
                            </div>
                        ) : (
                            nearbyIncidents.map(incident => (
                                <Card
                                    key={incident.id}
                                    className={cn(
                                        "cursor-pointer transition-all hover:bg-slate-800 border-l-4",
                                        selectedIncident === incident.id ? "bg-slate-800 border-blue-500" : "bg-slate-900 border-slate-800",
                                        incident.severity === 'critical' ? "border-l-red-500" :
                                            incident.severity === 'high' ? "border-l-amber-500" : "border-l-blue-500"
                                    )}
                                    onClick={() => setSelectedIncident(incident.id)}
                                >
                                    <div className="p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={incident.severity} className="text-[10px] uppercase">{incident.severity}</Badge>
                                            <span className="text-[10px] font-mono text-slate-400">{getTimeAgo(incident.createdAt)}</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-200 mb-1">{incident.type.toUpperCase()}</h4>
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3 truncate">
                                            <MapPin size={12} />
                                            {incident.location?.address || incident.address}
                                        </div>
                                        {incident.distance && <p className="text-xs text-blue-400 mb-2 font-mono flex items-center gap-1"><Navigation size={10} /> {incident.distance.toFixed(1)} MILES AWAY</p>}
                                        <Button
                                            variant="primary"
                                            className="w-full h-8 text-xs"
                                            onClick={(e) => { e.stopPropagation(); handleAcceptMission(incident); }}
                                            disabled={acceptingId === incident.id}
                                        >
                                            {acceptingId === incident.id ? <Loader className="animate-spin h-3 w-3" /> : 'ACCEPT MISSION'}
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )
                    ) : (
                        myMissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-dashed border-slate-800 rounded-lg m-2">
                                <User size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">No Missions</p>
                                <p className="text-xs">Accept tasks from nearby tab.</p>
                            </div>
                        ) : (
                            myMissions.map(mission => (
                                <Card
                                    key={mission.id}
                                    className={cn("border border-blue-500/30 bg-blue-950/10", selectedIncident === mission.id && "ring-1 ring-blue-500")}
                                    onClick={() => setSelectedIncident(mission.id)}
                                >
                                    <div className="p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge className="bg-blue-500 text-white text-[10px]">ASSIGNED</Badge>
                                            <span className="text-[10px] font-mono text-blue-300">{mission.status.replace('_', ' ').toUpperCase()}</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-white mb-2">{mission.type.toUpperCase()}</h4>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {mission.status === IncidentStatus.ASSIGNED && (
                                                <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white col-span-2" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mission, IncidentStatus.ON_THE_WAY); }}>
                                                    ON MY WAY
                                                </Button>
                                            )}
                                            {mission.status === IncidentStatus.ON_THE_WAY && (
                                                <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white col-span-2" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mission, IncidentStatus.IN_PROGRESS); }}>
                                                    ARRIVED
                                                </Button>
                                            )}
                                            {mission.status === IncidentStatus.IN_PROGRESS && (
                                                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white col-span-2" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mission, IncidentStatus.RESOLVED); }}>
                                                    MARK RESOLVED
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-7 text-xs col-span-2 text-slate-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDropMission(mission); }}>
                                                ABORT MISSION
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-950">
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-md shadow-lg">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Current Sector</p>
                        <div className="flex items-center gap-2 text-white font-mono text-sm">
                            <MapPin className="h-3 w-3 text-blue-500" />
                            {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'UNKNOWN'}
                        </div>
                    </div>
                </div>

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
    );
};

export default VolunteerDashboard;
