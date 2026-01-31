import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// import './MapView.css'; // REMOVED

const severityColors = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#10b981',
    resolved: '#6b7280'
};

const typeEmojis = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    flood: '🌊',
    police: '🚔',
    other: '⚠️'
};

const createCustomIcon = (incident) => {
    const color = incident.status === 'resolved'
        ? severityColors.resolved
        : severityColors[incident.severity] || severityColors.medium;

    const emoji = typeEmojis[incident.type] || typeEmojis.other;

    // Using Tailwind classes directly in HTML string
    return L.divIcon({
        className: 'custom-marker bg-transparent border-none', // Override Leaflet default
        html: `
            <div class="relative flex h-10 w-10 items-center justify-center">
                <div class="absolute inset-0 rounded-full opacity-20 animate-ping" style="background-color: ${color}"></div>
                <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg" style="background-color: ${color}; border-color: ${color}">
                    <span class="text-base leading-none select-none filter drop-shadow-sm">${emoji}</span>
                </div>
                ${incident.severity === 'critical' ? `
                    <div class="absolute -inset-2 rounded-full border-2 opacity-50 animate-pulse" style="border-color: ${color}"></div>
                ` : ''}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24]
    });
};

const userIcon = L.divIcon({
    className: 'user-marker bg-transparent border-none',
    html: `
        <div class="relative flex h-5 w-5 items-center justify-center">
            <div class="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75"></div>
            <div class="relative h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm"></div>
        </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const MapController = ({ center, selectedIncidentId, incidents }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedIncidentId) {
            const incident = incidents.find(i => i.id === selectedIncidentId);
            if (incident && incident.location) {
                const lat = incident.location.latitude || incident.location._lat;
                const lng = incident.location.longitude || incident.location._long;
                if (lat && lng) {
                    map.flyTo([lat, lng], 15, { duration: 0.5 });
                }
            }
        }
    }, [selectedIncidentId, incidents, map]);

    useEffect(() => {
        if (center && center.lat && center.lng) {
            map.setView([center.lat, center.lng], map.getZoom());
        }
    }, [center, map]);

    return null;
};

const zoneSeverityColors = {
    critical: { fill: '#ef4444', stroke: '#ef4444' },
    high: { fill: '#f97316', stroke: '#f97316' },
    elevated: { fill: '#f59e0b', stroke: '#f59e0b' }
};

const MapView = ({
    incidents = [],
    onIncidentClick,
    center = { lat: 40.7128, lng: -74.0060 },
    zoom = 12,
    showUserLocation = true,
    userLocation = null,
    selectedIncidentId = null,
    overloadZones = [],
    height = '100%',
    className,
    children // NEW: Allow child components (overlays)
}) => {
    const [mapReady, setMapReady] = useState(false);

    const getIncidentCoords = (incident) => {
        if (!incident.location) return null;
        const lat = incident.location.latitude || incident.location._lat;
        const lng = incident.location.longitude || incident.location._long;
        if (!lat || !lng) return null;
        return [lat, lng];
    };

    return (
        <div className={`relative w-full overflow-hidden bg-slate-900 ${className || ''}`} style={{ height }}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%', background: '#0f172a' }} // slate-900 matches
                whenReady={() => setMapReady(true)}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    // Dark theme map tiles
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapController
                    center={center}
                    selectedIncidentId={selectedIncidentId}
                    incidents={incidents}
                />

                {/* Allow overlays from parent components */}
                {children}

                {showUserLocation && userLocation && (
                    <>
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={userIcon}
                        >
                            <Popup className="leaflet-popup-dark">
                                <div className="text-sm font-semibold text-slate-900">
                                    Your Location
                                </div>
                            </Popup>
                        </Marker>
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={100}
                            pathOptions={{
                                color: '#3b82f6',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.1
                            }}
                        />
                    </>
                )}

                {overloadZones.map(zone => (
                    <Circle
                        key={zone.id}
                        center={[zone.center.lat, zone.center.lng]}
                        radius={zone.radius * 1609.34} // Convert miles to meters
                        pathOptions={{
                            color: zoneSeverityColors[zone.severity]?.stroke || '#f59e0b',
                            fillColor: zoneSeverityColors[zone.severity]?.fill || '#f59e0b',
                            fillOpacity: 0.2 + (zone.incidentCount / 10) * 0.2
                        }}
                    >
                        <Popup className="leaflet-popup-dark">
                            <div className="p-1">
                                <h4 className="font-bold text-slate-800">Overload Zone</h4>
                                <p className="text-xs text-slate-600">{zone.incidentCount} incidents</p>
                                <p className="text-xs font-semibold text-amber-600 capitalize">Severity: {zone.severity}</p>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {incidents.map(incident => {
                    const coords = getIncidentCoords(incident);
                    if (!coords) return null;

                    return (
                        <Marker
                            key={incident.id}
                            position={coords}
                            icon={createCustomIcon(incident)}
                            eventHandlers={{
                                click: () => onIncidentClick && onIncidentClick(incident)
                            }}
                        >
                            <Popup className="leaflet-popup-dark">
                                <div className="min-w-[200px] p-1">
                                    <div className="mb-2 flex items-center justify-between border-b pb-1">
                                        <span
                                            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider"
                                            style={{ backgroundColor: severityColors[incident.severity] }}
                                        >
                                            {incident.severity}
                                        </span>
                                        <span className="text-lg">{typeEmojis[incident.type]}</span>
                                    </div>
                                    <h3 className="mb-1 font-bold text-slate-900 leading-tight">
                                        {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Emergency
                                    </h3>
                                    <p className="mb-2 text-xs text-slate-600">{incident.address || 'Location pending...'}</p>
                                    {incident.description && (
                                        <p className="mb-2 text-xs text-slate-500 line-clamp-2 italic">
                                            "{incident.description}"
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                        Status: <span className="uppercase text-slate-600">{incident.status?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapView;
