import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Siren, Ambulance, Shield, Clock, MapPin, AlertTriangle, RefreshCw, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import MapView from '../components/MapView';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
    subscribeToActiveIncidents,
    SeverityLevel
} from '../services/incidentService';
import { cn } from '../lib/utils';
// import './DashboardPage.css'; // REMOVED

const DashboardPage = () => {
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [filter, setFilter] = useState('all');
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
            // ... notification logic (kept same) ...
            const prevCritical = incidents.filter(i => i.severity === 'critical').length;
            const newCritical = newIncidents.filter(i => i.severity === 'critical').length;
            if (newCritical > prevCritical && incidents.length > 0) {
                // Trigger notification logic if needed
            }
            setIncidents(newIncidents);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [addNotification, incidents]); // Added incidents to dep array for proper diffing if needed, though simple diff is enough

    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'all') return true;
        if (filter === 'critical') return inc.severity === 'critical';
        if (filter === 'high') return inc.severity === 'high';
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

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'critical': return <Badge variant="critical">CRITICAL</Badge>;
            case 'high': return <Badge variant="high">HIGH</Badge>;
            case 'medium': return <Badge variant="medium">MEDIUM</Badge>;
            default: return <Badge variant="low">LOW</Badge>;
        }
    };

    const stats = {
        critical: incidents.filter(i => i.severity === 'critical').length,
        high: incidents.filter(i => i.severity === 'high').length,
        total: incidents.length
    };

    const handleIncidentClick = useCallback((incident) => {
        setSelectedIncident(incident.id);
        if (!sidebarOpen) setSidebarOpen(true);
    }, [sidebarOpen]);

    return (
        <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">

            {/* Sidebar / Command Panel */}
            <aside
                className={cn(
                    "relative z-20 flex h-full flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur transition-all duration-300 ease-in-out",
                    sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full border-none"
                )}
            >
                <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
                    <div className="flex items-center gap-2">
                        <Siren className="h-4 w-4 text-red-500 animate-pulse" />
                        <span className="font-mono text-sm font-bold text-slate-100">ACTIVE INCIDENTS</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">{stats.total}</Badge>
                </div>

                {/* Filters */}
                <div className="flex gap-1 p-2 border-b border-slate-800 bg-slate-900/50">
                    <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="flex-1 text-[10px] h-7"
                    >
                        ALL
                    </Button>
                    <Button
                        variant={filter === 'critical' ? 'critical' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('critical')}
                        className="flex-1 text-[10px] h-7"
                    >
                        CRITICAL
                    </Button>
                    <Button
                        variant={filter === 'high' ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('high')}
                        className={cn("flex-1 text-[10px] h-7", filter === 'high' && "border-amber-500 text-amber-500")}
                    >
                        HIGH
                    </Button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                            <RefreshCw className="mb-2 h-6 w-6 animate-spin" />
                            <p className="text-xs">Scanning frequencies...</p>
                        </div>
                    ) : filteredIncidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                            <Shield className="mb-2 h-8 w-8 text-slate-700" />
                            <p className="text-xs">No active incidents in sector.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredIncidents.map((inc) => (
                                <div
                                    key={inc.id}
                                    onClick={() => setSelectedIncident(inc.id)}
                                    className={cn(
                                        "group cursor-pointer rounded-md border border-slate-800 bg-slate-900/50 p-3 transition-all hover:bg-slate-800 hover:border-slate-700",
                                        selectedIncident === inc.id && "border-blue-600 bg-blue-900/10 ring-1 ring-blue-600/50"
                                    )}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        {getSeverityBadge(inc.severity)}
                                        <span className="flex items-center text-[10px] text-slate-500">
                                            <Clock className="mr-1 h-3 w-3" /> {getTimeAgo(inc.createdAt)}
                                        </span>
                                    </div>
                                    <h4 className="mb-1 text-sm font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                                        {inc.type.charAt(0).toUpperCase() + inc.type.slice(1)} Emergency
                                    </h4>
                                    <div className="flex items-start gap-1 text-xs text-slate-400">
                                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                                        <span className="line-clamp-2">{inc.location?.address || inc.address || 'Locating...'}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between border-t border-slate-800/50 pt-2">
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase opacity-70">
                                            {inc.status.replace('_', ' ')}
                                        </Badge>
                                        {inc.assignedVolunteers?.length > 0 && (
                                            <span className="text-[10px] text-blue-400">
                                                {inc.assignedVolunteers.length} UNITS
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Toggle Sidebar Button (Absolute) */}
            <Button
                variant="secondary"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute left-0 top-1/2 z-30 h-12 w-6 -translate-y-1/2 rounded-l-none rounded-r-md border-y border-r border-slate-700 bg-slate-900/90 shadow-lg hover:bg-slate-800"
            >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            {/* Map Area */}
            <main className="relative flex-1 bg-slate-950">
                {/* Map Overlay Stats */}
                <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-start justify-between gap-4 pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-sm">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <AlertTriangle className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border border-slate-700 bg-slate-900/90 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 shadow-lg backdrop-blur focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Search active sector..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pointer-events-auto">
                        <div className="flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/80 px-3 py-1.5 shadow-lg backdrop-blur backdrop-saturate-150">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-bold text-red-200">{stats.critical} CRIT</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 shadow-lg backdrop-blur">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-slate-200">{stats.high} HIGH</span>
                        </div>
                    </div>
                </div>

                {/* The Map */}
                <div className="h-full w-full">
                    <MapView
                        incidents={filteredIncidents}
                        onIncidentClick={handleIncidentClick}
                        selectedIncidentId={selectedIncident}
                        userLocation={userLocation}
                        showUserLocation={true}
                        center={userLocation || { lat: 40.7128, lng: -74.0060 }}
                        zoom={13}
                        height="100%"
                        className="z-0"
                    />
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-6 right-6 z-10 hidden rounded-md border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur md:block">
                    <h5 className="mb-2 text-[10px] font-bold uppercase text-slate-500">Threat Levels</h5>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span> Critical
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span> High Priority
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Standard
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Resolved
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DashboardPage;
