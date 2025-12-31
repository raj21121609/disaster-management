import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import './GoogleMap.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const severityColors = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#10b981',
    resolved: '#6b7280'
};

const typeIcons = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    flood: '🌊',
    police: '🚔',
    other: '⚠️'
};

const GoogleMap = ({ 
    incidents = [], 
    onIncidentClick,
    onMapClick,
    center = { lat: 40.7128, lng: -74.0060 },
    zoom = 12,
    showUserLocation = true,
    userLocation = null,
    selectedIncidentId = null,
    height = '100%'
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const userMarkerRef = useRef(null);
    const infoWindowRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            setLoadError('Google Maps API key not configured');
            return;
        }

        const loader = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: 'weekly',
            libraries: ['places', 'marker']
        });

        loader.load()
            .then(() => {
                setIsLoaded(true);
            })
            .catch((error) => {
                console.error('Google Maps loading error:', error);
                setLoadError('Failed to load Google Maps');
            });
    }, []);

    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            styles: darkMapStyle,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy'
        });

        infoWindowRef.current = new google.maps.InfoWindow();

        if (onMapClick) {
            mapInstanceRef.current.addListener('click', (event) => {
                onMapClick({
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng()
                });
            });
        }
    }, [isLoaded, center, zoom, onMapClick]);

    const createMarkerContent = useCallback((incident) => {
        const color = incident.status === 'resolved' 
            ? severityColors.resolved 
            : severityColors[incident.severity] || severityColors.medium;
        
        const icon = typeIcons[incident.type] || typeIcons.other;
        const isSelected = incident.id === selectedIncidentId;
        
        const div = document.createElement('div');
        div.className = `custom-marker ${isSelected ? 'selected' : ''} severity-${incident.severity}`;
        div.innerHTML = `
            <div class="marker-container" style="
                background: ${color};
                width: ${isSelected ? '48px' : '40px'};
                height: ${isSelected ? '48px' : '40px'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${isSelected ? '24px' : '20px'};
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                border: 3px solid white;
                cursor: pointer;
                transition: all 0.2s ease;
                ${incident.severity === 'critical' ? 'animation: pulse-marker 2s infinite;' : ''}
            ">
                ${icon}
            </div>
            ${incident.severity === 'critical' ? `
                <div class="pulse-ring" style="
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    border: 2px solid ${color};
                    border-radius: 50%;
                    animation: pulse-ring 2s infinite;
                    pointer-events: none;
                "></div>
            ` : ''}
        `;
        
        return div;
    }, [selectedIncidentId]);

    useEffect(() => {
        if (!mapInstanceRef.current || !isLoaded) return;

        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        incidents.forEach(incident => {
            if (!incident.location) return;

            const lat = incident.location.latitude || incident.location._lat;
            const lng = incident.location.longitude || incident.location._long;

            if (!lat || !lng) return;

            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat, lng },
                map: mapInstanceRef.current,
                content: createMarkerContent(incident),
                title: incident.type
            });

            marker.addListener('click', () => {
                const infoContent = `
                    <div style="
                        background: #1e293b;
                        color: white;
                        padding: 12px;
                        border-radius: 8px;
                        min-width: 200px;
                        font-family: 'Inter', sans-serif;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 8px;
                        ">
                            <span style="
                                background: ${severityColors[incident.severity]};
                                padding: 2px 8px;
                                border-radius: 4px;
                                font-size: 12px;
                                font-weight: 600;
                                text-transform: uppercase;
                            ">${incident.severity}</span>
                            <span style="font-size: 18px;">${typeIcons[incident.type] || '⚠️'}</span>
                        </div>
                        <h3 style="
                            margin: 0 0 4px 0;
                            font-size: 16px;
                            font-weight: 600;
                            text-transform: capitalize;
                        ">${incident.type} Emergency</h3>
                        <p style="
                            margin: 0 0 8px 0;
                            font-size: 13px;
                            color: #94a3b8;
                        ">${incident.address || 'Location pending...'}</p>
                        ${incident.description ? `
                            <p style="
                                margin: 0 0 8px 0;
                                font-size: 12px;
                                color: #cbd5e1;
                            ">${incident.description.substring(0, 100)}${incident.description.length > 100 ? '...' : ''}</p>
                        ` : ''}
                        <div style="
                            font-size: 11px;
                            color: #64748b;
                        ">Status: ${incident.status}</div>
                    </div>
                `;

                infoWindowRef.current.setContent(infoContent);
                infoWindowRef.current.open(mapInstanceRef.current, marker);

                if (onIncidentClick) {
                    onIncidentClick(incident);
                }
            });

            markersRef.current.push(marker);
        });
    }, [incidents, isLoaded, createMarkerContent, onIncidentClick]);

    useEffect(() => {
        if (!mapInstanceRef.current || !isLoaded || !showUserLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
        }

        const location = userLocation || (navigator.geolocation ? null : center);

        if (userLocation) {
            const userDiv = document.createElement('div');
            userDiv.innerHTML = `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5);
                ">
                    <div style="
                        position: absolute;
                        width: 40px;
                        height: 40px;
                        background: rgba(59, 130, 246, 0.2);
                        border-radius: 50%;
                        top: -10px;
                        left: -10px;
                        animation: pulse-ring 2s infinite;
                    "></div>
                </div>
            `;

            userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: userLocation.lat, lng: userLocation.lng },
                map: mapInstanceRef.current,
                content: userDiv,
                title: 'Your Location'
            });
        }
    }, [userLocation, isLoaded, showUserLocation, center]);

    useEffect(() => {
        if (!mapInstanceRef.current || !selectedIncidentId) return;

        const incident = incidents.find(i => i.id === selectedIncidentId);
        if (incident && incident.location) {
            const lat = incident.location.latitude || incident.location._lat;
            const lng = incident.location.longitude || incident.location._long;
            mapInstanceRef.current.panTo({ lat, lng });
            mapInstanceRef.current.setZoom(15);
        }
    }, [selectedIncidentId, incidents]);

    if (loadError) {
        return (
            <div className="map-fallback" style={{ height }}>
                <div className="map-fallback-content">
                    <div className="map-error-icon">🗺️</div>
                    <h3>Map Unavailable</h3>
                    <p>{loadError}</p>
                    <p className="map-hint">Add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
                </div>
            </div>
        );
    }

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="map-fallback" style={{ height }}>
                <div className="map-fallback-content">
                    <div className="map-grid-bg"></div>
                    <div className="demo-markers">
                        {incidents.slice(0, 5).map((incident, index) => (
                            <div 
                                key={incident.id}
                                className={`demo-marker severity-${incident.severity}`}
                                style={{
                                    left: `${20 + (index * 15)}%`,
                                    top: `${30 + (index % 3) * 20}%`
                                }}
                                onClick={() => onIncidentClick && onIncidentClick(incident)}
                            >
                                {typeIcons[incident.type] || '⚠️'}
                            </div>
                        ))}
                    </div>
                    <div className="demo-badge">Demo Mode - Add Google Maps API Key</div>
                </div>
            </div>
        );
    }

    return (
        <div className="google-map-container" style={{ height }}>
            {!isLoaded && (
                <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading map...</p>
                </div>
            )}
            <div ref={mapRef} className="google-map" style={{ height: '100%', opacity: isLoaded ? 1 : 0 }} />
        </div>
    );
};

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#94a3b8' }]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#334155' }]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1e293b' }]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#475569' }]
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#0f172a' }]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#334155' }]
    },
    {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
    }
];

export default GoogleMap;
