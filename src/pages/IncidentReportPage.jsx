import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Camera, AlertOctagon, CheckCircle, Loader, Phone, X, WifiOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import MapView from '../components/MapView';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { createIncident } from '../services/incidentService';
import { queueIncident } from '../services/offlineIncidentStore';
import { analyzeLocalSeverity } from '../services/localSeverityAI';
import { cn } from '../lib/utils';

const IncidentReportPage = ({ onNavigate, initialData }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState(null);
    const [submittedIncident, setSubmittedIncident] = useState(null);

    // Vision Service State
    const [visualAnalysis, setVisualAnalysis] = useState(null);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

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

    // Auto-Start from Quick SOS
    useEffect(() => {
        if (initialData?.autoStart && initialData?.file) {
            setStep(2);
            // Small timeout to allow render
            setTimeout(() => {
                processImage(initialData.file);
            }, 100);
        }
    }, [initialData]);

    useEffect(() => {
        if (navigator.geolocation) {
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({ ...prev, latitude, longitude }));

                    if (navigator.onLine) {
                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                            const data = await response.json();
                            if (data.display_name) {
                                setFormData(prev => ({ ...prev, address: data.display_name.split(',').slice(0, 3).join(', ') }));
                            }
                        } catch (error) {
                            console.warn('Geocoding failed:', error);
                            setFormData(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                        }
                    } else {
                        setFormData(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                    }
                    setLocationLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLocationError('Unable to get location. Please enable location services.');
                    setLocationLoading(false);
                    // Default to NYC for demo
                    setFormData(prev => ({ ...prev, latitude: 40.7128, longitude: -74.0060, address: 'New York, NY (Default)' }));
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser');
            setLocationLoading(false);
        }
    }, []);

    const processImage = async (file) => {
        setIsAnalyzingImage(true);
        setVisualAnalysis(null);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);

            const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${BACKEND_URL}/analyze-image`, {
                method: 'POST',
                body: formDataUpload
            });

            if (response.ok) {
                const data = await response.json();
                setVisualAnalysis({
                    label: data.visual_label,
                    confidence: data.confidence,
                    model: data.model
                });

                // Auto-Prediction Logic
                const label = (data.visual_label || '').toLowerCase();
                let type = 'other';
                let severity = 'medium';

                // Type Mapping
                if (label.includes('fire') || label.includes('smoke') || label.includes('explosion') || label.includes('flame')) type = 'fire';
                else if (label.includes('med') || label.includes('blood') || label.includes('injury') || label.includes('person') || label.includes('body')) type = 'medical';
                else if (label.includes('crash') || label.includes('car') || label.includes('accident') || label.includes('wreck')) type = 'accident';
                else if (label.includes('flood') || label.includes('water')) type = 'flood';
                else if (label.includes('gun') || label.includes('police') || label.includes('weapon')) type = 'police';

                // Severity Mapping
                if (data.confidence > 0.75) {
                    // Visual confirmation increases base severity
                    if (['fire', 'medical', 'police'].includes(type)) severity = 'high';
                    if (label.includes('severe') || label.includes('massive') || label.includes('critical')) severity = 'critical';
                }

                // Generative Description
                let generatedDesc = `Visual Analysis: Positive identification of ${data.visual_label}.`;
                if (type === 'fire') generatedDesc = `EMERGENCY: Visual confirmation of active fire/smoke. Potential structure threat.`;
                else if (type === 'medical') generatedDesc = `MEDICAL: Visual indicators of human casualty or medical emergency.`;
                else if (type === 'accident') generatedDesc = `TRAFFIC: Vehicle collision/wreckage observed. Check for entrapment.`;
                else if (type === 'flood') generatedDesc = `ENV HAZARD: Flooding conditions detected. Water rescue assets may be required.`;
                else if (type === 'police') generatedDesc = `SECURITY: Law enforcement incident. Potential weapon or hostile activity.`;

                setFormData(prev => ({
                    ...prev,
                    type,
                    severity,
                    // Only auto-fill description if empty to not overwrite user input
                    description: generatedDesc // Force update for Quick SOS flow or new image
                }));

                addNotification({ type: 'success', severity: 'low', message: `Analyzed: ${type.toUpperCase()} (${severity.toUpperCase()})` });

            } else {
                console.warn('Image analysis failed');
                addNotification({ type: 'error', severity: 'low', message: 'Vision analysis unavailable' });
            }
        } catch (error) {
            console.error("Image analysis error", error);
        } finally {
            setIsAnalyzingImage(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) processImage(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) return;

        setLoading(true);
        try {
            const userId = currentUser?.uid || 'anonymous';

            if (!navigator.onLine) {
                // ... OFFLINE LOGIC ...
                const offlineAI = analyzeLocalSeverity(formData);
                const incidentData = {
                    ...formData,
                    userId,
                    severity: offlineAI.severity,
                    priorityScore: offlineAI.score,
                    status: 'queued',
                    isOffline: true
                };
                const queuedIncident = await queueIncident(incidentData, offlineAI);
                setSubmittedIncident({ ...queuedIncident, ...incidentData, aiSeverity: offlineAI.severity, priorityScore: offlineAI.score });
            } else {
                // ... ONLINE LOGIC ...
                const idToken = isAuthenticated ? await getIdToken() : 'anonymous';
                const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                let aiSeverity = formData.severity;
                let priorityScore = 50;
                let llmExplanation = '';

                try {
                    const response = await fetch(`${BACKEND_URL}/analyze-incident`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                        body: JSON.stringify({
                            type: formData.type,
                            description: formData.description,
                            visualAnalysis: visualAnalysis
                        })
                    });
                    if (response.ok) {
                        const analysis = await response.json();
                        aiSeverity = analysis.severity;
                        priorityScore = analysis.priorityScore;
                        llmExplanation = analysis.llmExplanation;
                    }
                } catch (err) { console.warn('Backend unavailable', err); }

                const incidentData = { ...formData, severity: aiSeverity, priorityScore, llmExplanation };
                const incident = await createIncident(incidentData, userId, idToken);
                setSubmittedIncident({ ...incident, aiSeverity, priorityScore, llmExplanation });
            }
            setStep(3);
            setTimeout(() => onNavigate('dashboard'), 6000);
        } catch (error) {
            console.error('Submission failed:', error);
            addNotification({ type: 'error', severity: 'high', message: `Failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const incidentTypes = [
        { id: 'medical', label: 'Medical', emoji: '🏥', color: 'text-red-500', border: 'border-red-500/50', bg: 'bg-red-500/10' },
        { id: 'fire', label: 'Fire', emoji: '🔥', color: 'text-orange-500', border: 'border-orange-500/50', bg: 'bg-orange-500/10' },
        { id: 'accident', label: 'Accident', emoji: '🚗', color: 'text-blue-500', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
        { id: 'flood', label: 'Flood', emoji: '🌊', color: 'text-cyan-500', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
        { id: 'police', label: 'Police', emoji: '🚔', color: 'text-violet-500', border: 'border-violet-500/50', bg: 'bg-violet-500/10' },
        { id: 'other', label: 'Other', emoji: '⚠️', color: 'text-slate-400', border: 'border-slate-500/50', bg: 'bg-slate-500/10' }
    ];

    const severityLevels = [
        { id: 'low', label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-500' },
        { id: 'medium', label: 'Medium', color: 'bg-blue-500', text: 'text-blue-500' },
        { id: 'high', label: 'High', color: 'bg-amber-500', text: 'text-amber-500' },
        { id: 'critical', label: 'Critical', color: 'bg-red-500', text: 'text-red-500' }
    ];

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center bg-slate-950 p-4">
            <div className="w-full max-w-2xl space-y-6">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                        {step === 3
                            ? (submittedIncident?.isOffline ? 'OFFLINE REPORT QUEUED' : 'INCIDENT LOGGED')
                            : 'TACTICAL INCIDENT REPORT'}
                    </h1>
                    <p className="mt-2 text-slate-400">
                        {step === 3 ? 'Mission coordinates transmitted to central command.' : 'Provide situational data for rapid response deployment.'}
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-center gap-4 text-sm font-mono">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-all", step >= 1 ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-slate-700 text-slate-600")}>1</div>
                    <div className={cn("h-0.5 w-12 transition-all", step >= 2 ? "bg-blue-500" : "bg-slate-800")}></div>
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-all", step >= 2 ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-slate-700 text-slate-600")}>2</div>
                    <div className={cn("h-0.5 w-12 transition-all", step >= 3 ? "bg-blue-500" : "bg-slate-800")}></div>
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-all", step >= 3 ? "border-green-500 bg-green-500/20 text-green-400" : "border-slate-700 text-slate-600")}>3</div>
                </div>

                <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                    <CardContent className="p-6">

                        {/* Step 1: Location */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-2 text-lg font-bold text-white">
                                    <MapPin className="text-blue-500" />
                                    <h2>CONFIRM SECTOR LOCATION</h2>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                                    {locationLoading ? (
                                        <div className="flex h-48 items-center justify-center text-slate-500">
                                            <Loader className="mr-2 h-6 w-6 animate-spin" /> ACQUIRING GPS SIGNAL...
                                        </div>
                                    ) : (
                                        <div className="h-64 relative">
                                            <MapView
                                                incidents={formData.latitude ? [{
                                                    id: 'current',
                                                    type: formData.type,
                                                    severity: formData.severity,
                                                    location: { latitude: formData.latitude, longitude: formData.longitude }
                                                }] : []}
                                                center={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : { lat: 40.7128, lng: -74.0060 }}
                                                zoom={15}
                                                showUserLocation={false}
                                                height="100%"
                                                className="z-0"
                                            />
                                            {/* Location Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 p-3 backdrop-blur border-t border-slate-800 z-[1000]">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Detected Coordinates</p>
                                                <p className="text-sm font-semibold text-white truncate">{formData.address || 'Click map to set location'}</p>
                                                {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
                                                {!navigator.onLine && <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><WifiOff size={10} /> OFFLINE MODE: GPS APPROXIMATED</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setLocationLoading(true);
                                            navigator.geolocation.getCurrentPosition(
                                                (pos) => {
                                                    setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                                                    setLocationLoading(false);
                                                },
                                                () => setLocationLoading(false)
                                            );
                                        }}
                                        disabled={locationLoading}
                                        className="border-slate-700 hover:bg-slate-800"
                                    >
                                        <Navigation className="mr-2 h-4 w-4" /> REFRESH
                                    </Button>
                                    <Button
                                        variant="critical"
                                        onClick={() => setStep(2)}
                                        disabled={!formData.latitude || locationLoading}
                                    >
                                        CONFIRM & PROCEED <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Form */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-2 text-lg font-bold text-white">
                                    <AlertOctagon className="text-amber-500" />
                                    <h2>INCIDENT DETAILS</h2>
                                </div>

                                <div className="space-y-3">
                                    <Label>Incident Type</Label>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {incidentTypes.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: t.id })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-all hover:bg-slate-800",
                                                    formData.type === t.id ? cn("bg-slate-800 border-2 shadow-lg", t.border) : "border-slate-800 bg-transparent text-slate-500"
                                                )}
                                            >
                                                <span className="text-2xl filter drop-shadow-md">{t.emoji}</span>
                                                <span className={cn("text-xs font-bold uppercase", formData.type === t.id ? "text-white" : "text-slate-500")}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Analysis Input */}
                                <div className="space-y-3">
                                    <Label>Visual Intel (Optional)</Label>
                                    <div className="flex flex-col gap-3">
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleImageUpload}
                                                className="bg-slate-950/50 border-slate-700 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 hover:file:bg-slate-700"
                                            />
                                            {isAnalyzingImage && (
                                                <div className="absolute right-3 top-2.5">
                                                    <Loader className="h-5 w-5 animate-spin text-blue-500" />
                                                </div>
                                            )}
                                        </div>

                                        {visualAnalysis && (
                                            <div className="flex items-center gap-3 rounded-md bg-slate-900/80 p-3 border border-slate-800 animate-in fade-in slide-in-from-top-2">
                                                <Camera className="text-purple-400 h-5 w-5" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-white uppercase">{visualAnalysis.label}</span>
                                                        <Badge variant={visualAnalysis.confidence > 0.8 ? 'default' : 'secondary'} className="text-[10px]">
                                                            {Math.round(visualAnalysis.confidence * 100)}% CONFIDENCE
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-mono">Analyzed by {visualAnalysis.model || 'AI Vision'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Estimated Severity</Label>
                                    <div className="flex gap-2 rounded-lg bg-slate-900/50 p-1 border border-slate-800">
                                        {severityLevels.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, severity: s.id })}
                                                className={cn(
                                                    "flex-1 rounded-md py-1.5 text-xs font-bold uppercase transition-all",
                                                    formData.severity === s.id ? cn("text-white shadow-md", s.color) : "text-slate-500 hover:text-slate-300"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Situation Report</Label>
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                        placeholder="Describe casualties, hazards, and immediate needs..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Contact (Optional)</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            type="tel"
                                            className="pl-9 bg-slate-950/50 border-slate-700"
                                            placeholder="+1 (555) 000-0000"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-slate-700 hover:bg-slate-800">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> BACK
                                    </Button>
                                    <Button type="submit" variant="critical" className="flex-1" disabled={loading}>
                                        {loading ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> TRANSMITTING...</> : 'TRANSMIT SIGNAL'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Success */}
                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-500">
                                <div className={cn("mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 border-4", submittedIncident?.isOffline ? "border-amber-500 text-amber-500" : "border-green-500 text-green-500")}>
                                    {submittedIncident?.isOffline ? <WifiOff size={48} /> : <CheckCircle size={48} />}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {submittedIncident?.isOffline ? 'OFFLINE REPORT QUEUED' : 'SIGNAL RECEIVED'}
                                </h2>
                                <p className="mb-8 text-slate-400 max-w-xs mx-auto">
                                    {submittedIncident?.isOffline ? 'Data stored locally. Synchronization pending connection.' : 'Incident logged. Units have been notified.'}
                                </p>

                                {submittedIncident && (
                                    <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900/80 p-4 backdrop-blur mb-6">
                                        {/* AI Badge placeholder or re-use existing if compatible */}
                                        <div className="mb-4 flex flex-col items-center">
                                            <Badge variant={submittedIncident.aiSeverity} className="text-sm px-3 py-1 mb-2 uppercase tracking-widest">
                                                SEVERITY: {submittedIncident.aiSeverity}
                                            </Badge>
                                            <span className="text-[10px] font-mono text-slate-500">PRIORITY SCORE: {submittedIncident.priorityScore}</span>
                                        </div>
                                        <div className="space-y-2 text-left text-sm">
                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span className="text-slate-500">ID</span>
                                                <span className="font-mono text-slate-300">{submittedIncident.id?.slice(0, 8)}...</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span className="text-slate-500">TYPE</span>
                                                <span className="font-bold uppercase text-white">{formData.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">LOC</span>
                                                <span className="truncate pl-4 text-right text-slate-300">{formData.address?.substring(0, 20)}...</span>
                                            </div>

                                            {submittedIncident.llmExplanation && (
                                                <div className="mt-4 border-t border-slate-800 pt-3">
                                                    <p className="mb-1 text-xs font-bold text-blue-400 uppercase">Mission Capabilities</p>
                                                    <p className="text-xs text-slate-400 text-left leading-relaxed">
                                                        {submittedIncident.llmExplanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button onClick={() => onNavigate('dashboard')} variant="secondary" className="min-w-[200px]">
                                    RETURN TO COMMAND
                                </Button>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default IncidentReportPage;
