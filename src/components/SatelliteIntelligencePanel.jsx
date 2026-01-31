import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Satellite, Brain, AlertTriangle, Check, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SatelliteIntelligencePanel = ({
    visible,
    onClose,
    onAnalysisComplete
}) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const { getIdToken } = useAuth();

    // Mock region data (in a real app, this would come from the map selection)
    const MOCK_REGION_DATA = {
        zone: "Sector 7 (Downtown)",
        disasterType: "Flood",
        affectedAreaKm2: 4.5,
        roadAccess: "low",
        populationDensity: "high"
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const token = await getIdToken();
            const BACKEND_URL = 'http://localhost:8080'; // Should use env var

            // 1. Get Analysis
            const analysisRes = await axios.post(
                `${BACKEND_URL}/api/satellite/analyze`,
                MOCK_REGION_DATA,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 2. Get Image
            const imageRes = await axios.get(
                `${BACKEND_URL}/api/satellite/image/${MOCK_REGION_DATA.disasterType}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setResult(analysisRes.data);
            onAnalysisComplete && onAnalysisComplete(imageRes.data);

        } catch (error) {
            console.error("Satellite Analysis Error:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (!visible) return null;

    return (
        <Card className="w-80 bg-slate-900/95 backdrop-blur border-slate-600 shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
            <CardHeader className="bg-slate-800/50 p-3 border-b border-slate-700 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase text-purple-400 flex items-center gap-2">
                    <Satellite className="h-4 w-4" /> Satellite Intelligence
                </CardTitle>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
                {!result ? (
                    <div className="space-y-3">
                        <div className="text-xs text-slate-400 border border-slate-700 rounded p-2 bg-slate-800/30">
                            <p className="font-semibold text-slate-300 mb-1">Target Zone: {MOCK_REGION_DATA.zone}</p>
                            <p>Data Source: Imagery (2h old)</p>
                            <p className="mt-1 text-yellow-500/80 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Non-live source
                            </p>
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {analyzing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                            ) : (
                                <><Brain className="mr-2 h-4 w-4" /> Run AI Analysis</>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        {/* Severity Badge */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Damage Severity</span>
                            <Badge className={cn(
                                "uppercase",
                                result.damageSeverity === 'Critical' ? "bg-red-500" :
                                    result.damageSeverity === 'High' ? "bg-orange-500" : "bg-blue-500"
                            )}>
                                {result.damageSeverity}
                            </Badge>
                        </div>

                        {/* Justification */}
                        <div className="bg-slate-800/50 rounded p-2 border-l-2 border-purple-500">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">AI Strategic Reasoning</p>
                            <p className="text-xs text-slate-300 italic">"{result.justification}"</p>
                        </div>

                        {/* Resources */}
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Recommended Allocation</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(result.recommendedResources).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center bg-slate-800 p-1.5 rounded text-xs">
                                        <span className="capitalize text-slate-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-bold text-white">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResult(null)}
                            className="w-full text-xs"
                        >
                            Reset Analysis
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SatelliteIntelligencePanel;
