import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

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
    
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-pin" style="background-color: ${color};">
                <span class="marker-emoji">${emoji}</span>
            </div>
            ${incident.severity === 'critical' ? '<div class="pulse-ring" style="border-color: ' + color + ';"></div>' : ''}
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};

const userIcon = L.divIcon({
    className: 'user-marker',
    html: `
        <div class="user-dot"></div>
        <div class="user-pulse"></div>
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
    height = '100%'
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
        <div className="map-view-container" style={{ height }}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                whenReady={() => setMapReady(true)}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                <MapController 
                    center={center} 
                    selectedIncidentId={selectedIncidentId}
                    incidents={incidents}
                />

                {showUserLocation && userLocation && (
                    <>
                        <Marker 
                            position={[userLocation.lat, userLocation.lng]} 
                            icon={userIcon}
                        >
                            <Popup>
                                <div className="popup-content">
                                    <strong>Your Location</strong>
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
                        <Popup>
                            <div className="overload-popup">
                                <h4>Overload Zone</h4>
                                <p>{zone.incidentCount} incidents in this area.</p>
                                <p>Severity: {zone.severity}</p>
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
                            <Popup>
                                <div className="incident-popup">
                                    <div className="popup-header">
                                        <span 
                                            className="popup-badge"
                                            style={{ backgroundColor: severityColors[incident.severity] }}
                                        >
                                            {incident.severity}
                                        </span>
                                        <span className="popup-type">{typeEmojis[incident.type]}</span>
                                    </div>
                                    <h3 className="popup-title">
                                        {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Emergency
                                    </h3>
                                    <p className="popup-address">{incident.address || 'Location pending...'}</p>
                                    {incident.description && (
                                        <p className="popup-desc">
                                            {incident.description.substring(0, 80)}
                                            {incident.description.length > 80 ? '...' : ''}
                                        </p>
                                    )}
                                    <div className="popup-status">
                                        Status: {incident.status?.replace('_', ' ')}
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
