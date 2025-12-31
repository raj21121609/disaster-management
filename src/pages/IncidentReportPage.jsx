import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Camera, AlertOctagon, CheckCircle, Loader, Phone, X } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import MapView from '../components/MapView';
import AISeverityBadge from '../components/AISeverityBadge';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { createIncident, IncidentType } from '../services/incidentService';
import './IncidentReportPage.css';

const IncidentReportPage = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState(null);
    const [submittedIncident, setSubmittedIncident] = useState(null);

    const [formData, setFormData] = useState({
        type: 'medical',
        severity: 'high',
        description: '',
        latitude: null,
        longitude: null,
        address: '',
        contactPhone: ''
    });

    const { currentUser, getIdToken, isAuthenticated } = useAuth();
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (navigator.geolocation) {
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({
                        ...prev,
                        latitude,
                        longitude
                    }));

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();
                        if (data.display_name) {
                            setFormData(prev => ({
                                ...prev,
                                address: data.display_name.split(',').slice(0, 3).join(', ')
                            }));
                        }
                    } catch (error) {
                        console.warn('Geocoding failed:', error);
                        setFormData(prev => ({
                            ...prev,
                            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                        }));
                    }

                    setLocationLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLocationError('Unable to get your location. Please enable location services.');
                    setLocationLoading(false);
                    setFormData(prev => ({
                        ...prev,
                        latitude: 40.7128,
                        longitude: -74.0060,
                        address: 'New York, NY (Default)'
                    }));
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser');
            setLocationLoading(false);
        }
    }, []);

    const handleMapClick = (location) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            address: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.latitude || !formData.longitude) {
            addNotification({
                type: 'error',
                severity: 'high',
                message: 'Please confirm your location before submitting'
            });
            return;
        }

        setLoading(true);

        try {
            const idToken = isAuthenticated ? await getIdToken() : 'anonymous';
            const userId = currentUser?.uid || 'anonymous';
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

            let aiSeverity = formData.severity;
            let priorityScore = 50;

            try {
                const response = await fetch(`${BACKEND_URL}/analyze-incident`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        type: formData.type,
                        description: formData.description
                    })
                });

                if (response.ok) {
                    const analysis = await response.json();
                    aiSeverity = analysis.severity;
                    priorityScore = analysis.priorityScore;
                    console.log('AI Analysis:', analysis);
                }
            } catch (backendError) {
                console.warn('Backend unavailable, using user-selected severity:', backendError);
            }

            const incidentData = {
                ...formData,
                severity: aiSeverity,
                priorityScore: priorityScore
            };

            const incident = await createIncident(incidentData, userId, idToken);

            setSubmittedIncident({ ...incident, aiSeverity, priorityScore });
            setStep(3);

            addNotification({
                type: 'success',
                severity: 'low',
                message: `Emergency reported! AI severity: ${aiSeverity.toUpperCase()}`
            });

            setTimeout(() => {
                onNavigate('dashboard');
            }, 3000);

        } catch (error) {
            console.error('Failed to submit incident:', error);
            console.error('Error details:', error.message, error.code);
            addNotification({
                type: 'error',
                severity: 'high',
                message: `Failed: ${error.message || 'Unknown error'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const incidentTypes = [
        { id: 'medical', label: 'Medical', emoji: '🏥', color: '#ef4444' },
        { id: 'fire', label: 'Fire', emoji: '🔥', color: '#f59e0b' },
        { id: 'accident', label: 'Accident', emoji: '🚗', color: '#3b82f6' },
        { id: 'flood', label: 'Flood', emoji: '🌊', color: '#06b6d4' },
        { id: 'police', label: 'Police', emoji: '🚔', color: '#8b5cf6' },
        { id: 'other', label: 'Other', emoji: '⚠️', color: '#6b7280' }
    ];

    const severityLevels = [
        { id: 'low', label: 'Low', color: '#10b981' },
        { id: 'medium', label: 'Medium', color: '#3b82f6' },
        { id: 'high', label: 'High', color: '#f59e0b' },
        { id: 'critical', label: 'Critical', color: '#ef4444' }
    ];

    return (
        <div className="report-page">
            <div className="report-container">
                <div className="report-header text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">
                        {step === 3 ? 'Report Submitted' : 'Report Emergency'}
                    </h1>
                    <p className="text-secondary">
                        {step === 3
                            ? 'Help is on the way'
                            : 'Provide details for rapid response.'}
                    </p>
                </div>

                <div className="steps-indicator mb-6">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>

                <Card className="report-card">
                    {step === 1 && (
                        <div className="form-step">
                            <h3 className="step-title">
                                <MapPin size={20} /> Confirm Location
                            </h3>

                            <div className="location-preview">
                                {locationLoading ? (
                                    <div className="location-loading">
                                        <Loader className="spin" size={32} />
                                        <p>Getting your location...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="map-preview-container">
                                            <MapView
                                                incidents={formData.latitude ? [{
                                                    id: 'current',
                                                    type: formData.type,
                                                    severity: formData.severity,
                                                    location: {
                                                        latitude: formData.latitude,
                                                        longitude: formData.longitude
                                                    }
                                                }] : []}
                                                center={formData.latitude ? {
                                                    lat: formData.latitude,
                                                    lng: formData.longitude
                                                } : { lat: 40.7128, lng: -74.0060 }}
                                                zoom={15}
                                                showUserLocation={false}
                                                height="200px"
                                            />
                                        </div>
                                        <div className="location-details">
                                            <span className="text-sm font-bold block">
                                                {formData.address || 'Click on map to set location'}
                                            </span>
                                            <span className="text-xs text-muted">
                                                {formData.latitude
                                                    ? `GPS: ${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}`
                                                    : 'Tap the map to adjust your location'}
                                            </span>
                                            {locationError && (
                                                <span className="text-xs text-emergency mt-1 block">
                                                    {locationError}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="form-actions">
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    icon={Navigation}
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            setLocationLoading(true);
                                            navigator.geolocation.getCurrentPosition(
                                                (pos) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        latitude: pos.coords.latitude,
                                                        longitude: pos.coords.longitude
                                                    }));
                                                    setLocationLoading(false);
                                                },
                                                () => setLocationLoading(false)
                                            );
                                        }
                                    }}
                                    disabled={locationLoading}
                                >
                                    Refresh Location
                                </Button>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.latitude || locationLoading}
                                >
                                    Confirm Location
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="form-step">
                            <h3 className="step-title">
                                <AlertOctagon size={20} /> Incident Details
                            </h3>

                            <div className="form-group">
                                <label className="form-label">Incident Type</label>
                                <div className="type-grid">
                                    {incidentTypes.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`type-btn ${formData.type === t.id ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: t.id })}
                                            style={formData.type === t.id ? { borderColor: t.color } : {}}
                                        >
                                            <span className="type-emoji">{t.emoji}</span>
                                            <span className="type-label">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Severity Level</label>
                                <div className="severity-slider">
                                    {severityLevels.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            className={`severity-btn ${formData.severity === s.id ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, severity: s.id })}
                                            style={{
                                                '--severity-color': s.color,
                                                background: formData.severity === s.id ? s.color : 'transparent'
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Describe the situation... (injuries, hazards, number of people affected)"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contact Phone (Optional)</label>
                                <div className="input-wrapper">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className="form-input"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-actions row">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="spin" size={18} />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="success-step text-center py-8">
                            <div className="success-icon mb-4">
                                <CheckCircle size={64} className="text-success mx-auto" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Report Submitted</h3>
                            <p className="text-secondary mb-4">
                                Emergency responders have been notified.
                            </p>

                            {submittedIncident && (
                                <div className="incident-summary">
                                    <AISeverityBadge
                                        severity={submittedIncident.aiSeverity}
                                        priorityScore={submittedIncident.priorityScore}
                                        size="lg"
                                    />

                                    <div className="summary-details">
                                        <div className="summary-item">
                                            <span className="summary-label">Incident ID:</span>
                                            <span className="summary-value">{submittedIncident.id?.slice(0, 8)}...</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Type:</span>
                                            <span className="summary-value capitalize">{formData.type}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Location:</span>
                                            <span className="summary-value">{formData.address?.substring(0, 40)}...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-muted mt-4">Redirecting to dashboard...</p>

                            <Button
                                variant="secondary"
                                className="mt-4"
                                onClick={() => onNavigate('dashboard')}
                            >
                                Go to Dashboard Now
                            </Button>
                        </div>
                    )}
                </Card>

                {!isAuthenticated && step < 3 && (
                    <p className="auth-hint text-center text-sm text-muted mt-4">
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth'); }} className="text-info">
                            Sign in
                        </a> to track your reports and receive updates.
                    </p>
                )}
            </div>
        </div>
    );
};

export default IncidentReportPage;
