import React from 'react';
import { Shield, Radio, Users, Activity, MapPin, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import './LandingPage.css';

const LandingPage = ({ onNavigate }) => {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="live-dot"></span>
                            Live Emergency Response Network
                        </div>
                        <h1 className="hero-title">
                            Real-Time Crisis Response.<br />
                            <span className="text-secondary-highlight">One Platform. One Map.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Connects citizens, volunteers, and agencies in a unified dashboard for rapid emergency coordination and resource allocation.
                        </p>
                        <div className="hero-actions">
                            <Button
                                variant="primary"
                                size="lg"
                                icon={Radio}
                                onClick={() => onNavigate('report')}
                                className="animate-pulse-red"
                            >
                                Report an Emergency
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={Activity}
                                onClick={() => onNavigate('dashboard')}
                            >
                                View Live Dashboard
                            </Button>
                        </div>

                        <div className="trust-indicators">
                            <div className="trust-item">
                                <Shield size={20} className="text-success" />
                                <span>Verified by Agencies</span>
                            </div>
                            <div className="trust-item">
                                <Users size={20} className="text-info" />
                                <span>50k+ Volunteers</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        {/* Abstract Map Visualization */}
                        <div className="map-visual-container">
                            <div className="map-grid"></div>
                            <div className="map-marker marker-1"></div>
                            <div className="map-marker marker-2"></div>
                            <div className="map-marker marker-3"></div>
                            <div className="map-radar"></div>

                            <div className="visual-card card-1">
                                <div className="visual-card-icon bg-emergency">
                                    <Radio size={16} color="white" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted">New Incident</div>
                                    <div className="text-sm font-bold">Fire Reported</div>
                                </div>
                            </div>

                            <div className="visual-card card-2">
                                <div className="visual-card-icon bg-success">
                                    <Users size={16} color="white" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted">Response</div>
                                    <div className="text-sm font-bold">Unit Dispatched</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Integrated Response System</h2>
                        <p className="section-subtitle">Designed for high-stress environments where every second counts.</p>
                    </div>

                    <div className="features-grid">
                        <Card className="feature-card">
                            <div className="feature-icon-wrapper text-emergency">
                                <MapPin size={32} />
                            </div>
                            <h3 className="feature-title">Live Geolocation</h3>
                            <p className="feature-desc">
                                Pinpoint accuracy for incident reporting with real-time GPS tracking and dynamic map overlays.
                            </p>
                        </Card>

                        <Card className="feature-card">
                            <div className="feature-icon-wrapper text-warning">
                                <Users size={32} />
                            </div>
                            <h3 className="feature-title">Volunteer Mobilization</h3>
                            <p className="feature-desc">
                                Nearby qualified volunteers receive instant alerts to provide first-aid before ambulances arrive.
                            </p>
                        </Card>

                        <Card className="feature-card">
                            <div className="feature-icon-wrapper text-info">
                                <Activity size={32} />
                            </div>
                            <h3 className="feature-title">Agency Command</h3>
                            <p className="feature-desc">
                                Uniified data stream for police, fire, and medical dispatchers to coordinate resources efficiently.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
