import React, { useState, useEffect } from 'react';
import {
    Activity, Truck, Users, Clock, AlertTriangle,
    MapPin, CheckCircle, RefreshCw, Shield, Brain, Layers, Filter
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import MapView from '../components/MapView';
import AIPredictionPanel from '../components/AIPredictionPanel';
import OverloadZoneAlert from '../components/OverloadZoneAlert';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
    subscribeToIncidents,
    updateIncidentStatus,
    assignResource,
    IncidentStatus
} from '../services/incidentService';
import { getSystemStatus } from '../services/overloadDetectionService';
import { cn } from '../lib/utils';
// import './AgencyDashboard.css'; // REMOVED

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

    // Mock Limit for demo
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
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!incidents || incidents.length === 0) {
            setSystemStatus('normal');
            setOverloadZones([]);
            return;
        }

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
            return ['reported', 'assigned', 'in_progress', 'on_the_way'].includes(inc.status);
        }
        return inc.status === filterStatus;
    });

    const handleAssignResource = async (incidentId, resource) => {
        try {
            await assignResource(incidentId, resource.id, resource.type);
            addNotification({ type: 'success', severity: 'low', message: `${resource.label} assigned` });
            setShowAssignModal(false);
        } catch (error) {
            console.error('Failed to assign:', error);
            addNotification({ type: 'error', severity: 'high', message: 'Failed to assign resource' });
        }
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

    const availableResources = resources.filter(r => r.status === 'available');
    const busyResources = resources.filter(r => r.status === 'busy');
    const activeIncidents = incidents.filter(inc => ['reported', 'assigned', 'in_progress', 'on_the_way'].includes(inc.status));
    const criticalIncidents = incidents.filter(inc => inc.severity === 'critical' && inc.status !== 'resolved');

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
            {/* Left Panel: Incident List */}
            <aside className="w-96 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur z-20">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="font-bold text-slate-100 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        INCIDENT FEED
                    </h2>
                    <Badge variant="outline" className="text-xs font-mono">{activeIncidents.length} ACTIVE</Badge>
                </div>

                <div className="p-2 border-b border-slate-800 flex gap-2">
                    <Button
                        variant={filterStatus === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                        className="flex-1 text-[10px]"
                    >
                        ALL
                    </Button>
                    <Button
                        variant={filterStatus === 'active' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('active')}
                        className="flex-1 text-[10px]"
                    >
                        ACTIVE
                    </Button>
                    <Button
                        variant={filterStatus === 'resolved' ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('resolved')}
                        className="flex-1 text-[10px]"
                    >
                        RESOLVED
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-slate-500" /></div>
                    ) : filteredIncidents.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 text-sm">No incidents found</div>
                    ) : (
                        filteredIncidents.slice(0, 50).map(inc => (
                            <div
                                key={inc.id}
                                onClick={() => { setSelectedIncident(inc.id); setSelectedIncidentData(inc); }}
                                className={cn(
                                    "p-3 rounded-md border cursor-pointer transition-all hover:bg-slate-800/80",
                                    selectedIncident === inc.id ? "bg-slate-800 border-blue-500/50 shadow-md transform scale-[1.01]" : "bg-slate-900 border-slate-800",
                                    inc.severity === 'critical' && "border-l-4 border-l-red-500"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={inc.severity} className="text-[10px] px-1.5 h-5 uppercase">{inc.severity}</Badge>
                                        <span className="text-xs font-mono text-slate-500">{getTimeAgo(inc.createdAt)}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] h-4 border-slate-700 text-slate-400">{inc.status.replace('_', ' ')}</Badge>
                                </div>
                                <h4 className="font-semibold text-sm text-slate-200 mb-1">{inc.type.toUpperCase()} HAZARD</h4>
                                <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{inc.address || 'Unknown Location'}</span>
                                </div>
                                {inc.status === 'reported' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-2 w-full h-7 text-xs"
                                        onClick={(e) => { e.stopPropagation(); setSelectedIncident(inc.id); setShowAssignModal(true); }}
                                    >
                                        DISPATCH UNITS
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Area: Map & Stats */}
            <main className="flex-1 flex flex-col relative bg-slate-950">
                {/* Stats Bar */}
                <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-6 gap-6 overflow-x-auto">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full animate-pulse", systemStatus === 'critical' ? 'bg-red-500' : 'bg-emerald-500')}></div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Status</p>
                            <p className="text-sm font-bold text-white uppercase">{systemStatus}</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available Units</p>
                        <p className="text-sm font-bold text-blue-400">{availableResources.length} <span className="text-slate-600">/ {resources.length}</span></p>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Critical Active</p>
                        <p className="text-sm font-bold text-red-400">{criticalIncidents.length}</p>
                    </div>
                    <div className="flex-1"></div>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} icon={RefreshCw}>SYNC</Button>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative">
                    <MapView
                        incidents={filteredIncidents}
                        onIncidentClick={(inc) => { setSelectedIncident(inc.id); setSelectedIncidentData(inc); }}
                        selectedIncidentId={selectedIncident}
                        showUserLocation={false}
                        center={{ lat: 40.7128, lng: -74.0060 }}
                        zoom={11}
                        height="100%"
                        overloadZones={overloadZones}
                    />

                    {/* Right Floating Panels */}
                    <div className="absolute top-4 right-4 w-80 space-y-4 pointer-events-none">
                        {/* Resource Summary Panel */}
                        <Card className="pointer-events-auto bg-slate-900/90 backdrop-blur border-slate-700 shadow-xl">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-slate-400 flex justify-between">
                                    Fleet Status <Truck size={14} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2">
                                {[
                                    { type: 'ambulance', color: 'bg-red-500' },
                                    { type: 'fire', color: 'bg-orange-500' },
                                    { type: 'police', color: 'bg-blue-500' }
                                ].map(r => {
                                    const total = resources.filter(res => res.type === r.type).length;
                                    const busy = resources.filter(res => res.type === r.type && res.status === 'busy').length;
                                    const percent = total ? (busy / total) * 100 : 0;
                                    return (
                                        <div key={r.type} className="text-xs">
                                            <div className="flex justify-between mb-1">
                                                <span className="capitalize text-slate-300">{r.type}</span>
                                                <span className="text-slate-500">{busy}/{total} Deployed</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className={cn("h-full transition-all", r.color)} style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* AI Prediction Panel */}
                        {selectedIncidentData && showAIPanel && (
                            <div className="pointer-events-auto">
                                <AIPredictionPanel incident={selectedIncidentData} />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showAssignModal && selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md border-slate-700 bg-slate-900 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Deploy Units</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-400">Select an available unit to dispatch to incident #{selectedIncident.slice(0, 6)}</p>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                {availableResources.length > 0 ? availableResources.map(res => (
                                    <button
                                        key={res.id}
                                        onClick={() => handleAssignResource(selectedIncident, res)}
                                        className="flex items-center justify-between p-3 rounded border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-blue-500 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">
                                                {res.type === 'ambulance' ? '🚑' : res.type === 'fire' ? '🚒' : '🚔'}
                                            </span>
                                            <div>
                                                <div className="font-bold text-sm text-white">{res.label}</div>
                                                <div className="text-[10px] text-slate-400 uppercase">{res.status}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-blue-400 border-blue-900 bg-blue-900/20">READY</Badge>
                                    </button>
                                )) : (
                                    <div className="p-4 text-center text-slate-500 border border-dashed border-slate-800 rounded">
                                        NO UNITS AVAILABLE
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AgencyDashboard;
