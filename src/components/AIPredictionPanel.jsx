import React, { useState, useEffect } from 'react';
import {
    Brain, Truck, Users, Clock, AlertTriangle,
    CheckCircle, Package, Lightbulb, TrendingUp,
    RefreshCw, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { predictResources } from '../services/aiPredictionService';
import { cn } from '../lib/utils';
// import './AIPredictionPanel.css'; // REMOVED

const AIPredictionPanel = ({ incident, onClose }) => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (incident) {
            loadPrediction();
        }
    }, [incident]);

    const loadPrediction = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await predictResources(incident);
            setPrediction(result);
        } catch (err) {
            setError('Failed to generate prediction');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!incident) return null;

    return (
        <Card className="border-slate-700 bg-slate-900/95 backdrop-blur shadow-xl animate-in slide-in-from-right-8 fade-in duration-500 ease-in-out">
            <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="text-blue-500 h-5 w-5" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-100">AI Resource Prediction</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-blue-900 text-blue-400 bg-blue-900/10 flex items-center gap-1">
                    <Zap size={10} /> CRISIS.ONE AI
                </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {/* Context Badge */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Analysis Target:</span>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-bold capitalize">{incident.type}</span>
                        <Badge variant={incident.severity} className="uppercase text-[10px] px-1.5">{incident.severity}</Badge>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                        <RefreshCw className="animate-spin mb-2 text-blue-500" size={24} />
                        <p className="text-xs font-mono animate-pulse">RUNNING PREDICTION MODEL...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <AlertTriangle className="text-amber-500 mb-2" size={24} />
                        <p className="text-xs text-slate-400 mb-3">{error}</p>
                        <Button variant="outline" size="sm" onClick={loadPrediction}>Retry Analysis</Button>
                    </div>
                ) : prediction && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out">

                        {/* Risk Assessment */}
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-md border",
                            incident.severity === 'critical' ? "bg-red-950/20 border-red-900/50 text-red-200" :
                                incident.severity === 'high' ? "bg-amber-950/20 border-amber-900/50 text-amber-200" :
                                    "bg-blue-950/20 border-blue-900/50 text-blue-200"
                        )}>
                            <AlertTriangle size={18} />
                            <span className="text-xs font-medium">{prediction.riskAssessment}</span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                <Clock className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white leading-none">{prediction.estimatedResponseTime}m</div>
                                <div className="text-[10px] text-slate-500 uppercase">Est. Time</div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                <Users className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white leading-none">{prediction.requiredPersonnel}</div>
                                <div className="text-[10px] text-slate-500 uppercase">Personnel</div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                <TrendingUp className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white leading-none">{prediction.confidence}%</div>
                                <div className="text-[10px] text-slate-500 uppercase">Conf.</div>
                            </div>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Truck size={12} /> Recommended Assets
                            </h4>
                            <div className="space-y-1.5">
                                {prediction.resources.map((res, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs bg-slate-800/50 p-2 rounded border border-slate-700/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-300 capitalize">{res.type}</span>
                                            {res.priority === 'high' && <Badge variant="destructive" className="text-[10px] h-4">HIGH PRIORITY</Badge>}
                                        </div>
                                        <span className="font-mono font-bold text-white bg-slate-700 px-1.5 rounded">x{res.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Recommendations */}
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Lightbulb size={12} /> Tactical Advisories
                            </h4>
                            <ul className="space-y-1">
                                {prediction.recommendations.map((rec, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-slate-300">
                                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="primary" size="sm" className="w-full text-xs">
                                <Truck className="mr-1 h-3 w-3" /> AUTO-DISPATCH
                            </Button>
                            <Button variant="outline" size="sm" className="w-full text-xs border-slate-700 hover:bg-slate-800" onClick={loadPrediction}>
                                REFRESH
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AIPredictionPanel;
