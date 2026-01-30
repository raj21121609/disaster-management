import React from 'react';
import { AlertTriangle, MapPin, Users, Shield, Clock, Phone, Activity, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
// import './LandingPage.css'; // REMOVED

const LandingPage = ({ onNavigate }) => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-50 selection:bg-red-900/50">

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

                <div className="container relative z-10 mx-auto px-4 md:px-6">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge variant="critical" className="mb-6 animate-pulse-weak">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            EMERGENCY SYSTEM ONLINE
                        </Badge>

                        <h1 className="mb-6 text-4xl font-extrabold tracking-tight leading-none text-white md:text-6xl lg:text-7xl">
                            REAL-TIME <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">CRISIS</span> COORDINATION
                        </h1>

                        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400 md:text-xl">
                            Advanced command center logic for disaster management.
                            Report incidents, deploy assets, and coordinate response in real-time.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button
                                variant="critical"
                                size="lg"
                                className="w-full sm:w-auto text-lg h-14"
                                onClick={() => onNavigate('report')}
                            >
                                <Phone className="mr-2 h-5 w-5" />
                                INITIATE SOS REPORT
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto text-lg h-14 border-slate-700 bg-slate-900/50 hover:bg-slate-800"
                                onClick={() => onNavigate('dashboard')}
                            >
                                <MapPin className="mr-2 h-5 w-5" />
                                VIEW LIVE MAP
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Stats Ticker */}
            <div className="border-y border-slate-800 bg-slate-900/50 backdrop-blur">
                <div className="container mx-auto px-4 py-4 md:px-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-900/20 md:h-12 md:w-12">
                                <Activity className="h-5 w-5 text-green-500 md:h-6 md:w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">System Status</p>
                                <p className="font-mono text-lg font-bold text-green-500">OPTIMAL</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/20 md:h-12 md:w-12">
                                <Clock className="h-5 w-5 text-blue-500 md:h-6 md:w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Avg. Response</p>
                                <p className="font-mono text-lg font-bold text-slate-200 text-shadow-glow">&lt; 3 MIN</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-900/20 md:h-12 md:w-12">
                                <AlertTriangle className="h-5 w-5 text-red-500 md:h-6 md:w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Active Incidents</p>
                                <p className="font-mono text-lg font-bold text-red-500">42</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-900/20 md:h-12 md:w-12">
                                <Users className="h-5 w-5 text-amber-500 md:h-6 md:w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Volunteers</p>
                                <p className="font-mono text-lg font-bold text-amber-500">1,240</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features (Grid) */}
            <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
                <div className="mb-12 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">TACTICAL CAPABILITIES</h2>
                    <p className="mt-4 text-slate-400">Integrated suite for emergency management</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-slate-800 bg-slate-900/40 p-6 backdrop-blur transition-all hover:bg-slate-900/60 hover:shadow-lg hover:shadow-blue-900/20 group">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-mono text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">01</div>
                        <h3 className="mb-2 text-xl font-bold text-slate-100">Rapid Reporting</h3>
                        <p className="text-slate-400">Offline-first submission with AI severity estimation. Works even when infrastructure fails.</p>
                    </Card>
                    <Card className="border-slate-800 bg-slate-900/40 p-6 backdrop-blur transition-all hover:bg-slate-900/60 hover:shadow-lg hover:shadow-blue-900/20 group">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-mono text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">02</div>
                        <h3 className="mb-2 text-xl font-bold text-slate-100">Live Coordination</h3>
                        <p className="text-slate-400">Real-time geospatial tracking of incidents and volunteer assets on a unified tactical map.</p>
                    </Card>
                    <Card className="border-slate-800 bg-slate-900/40 p-6 backdrop-blur transition-all hover:bg-slate-900/60 hover:shadow-lg hover:shadow-blue-900/20 group">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-mono text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">03</div>
                        <h3 className="mb-2 text-xl font-bold text-slate-100">Secure Network</h3>
                        <p className="text-slate-400">Encrypted communication channels for agencies and verified volunteers.</p>
                    </Card>
                </div>
            </section>

            {/* CTA Bottom */}
            <section className="border-t border-slate-800 bg-slate-900 py-16">
                <div className="container mx-auto max-w-2xl px-4 text-center">
                    <Shield className="mx-auto mb-6 h-12 w-12 text-slate-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Join the Network</h2>
                    <p className="mb-8 text-slate-400">
                        Become a verified responder or register your agency to access the command center.
                    </p>
                    <Button
                        size="lg"
                        variant="default" // Blue
                        onClick={() => onNavigate('auth')}
                        className="min-w-[200px]"
                    >
                        Access Terminal <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
