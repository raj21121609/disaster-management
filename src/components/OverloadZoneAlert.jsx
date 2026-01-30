import React from 'react';
import { AlertTriangle, ChevronDown, MapPin, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
// import './OverloadZoneAlert.css'; // REMOVED

const OverloadZoneAlert = ({ zones = [], showDetails, onToggleDetails }) => {
    if (zones.length === 0) return null;

    const overallSeverity = zones.some(z => z.severity === 'critical') ? 'critical' : 'elevated';

    return (
        <div className="relative z-50">
            <button
                onClick={onToggleDetails}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg transition-all animate-pulse-slow",
                    overallSeverity === 'critical'
                        ? "bg-red-500 text-white border-red-400 hover:bg-red-600"
                        : "bg-amber-500 text-white border-amber-400 hover:bg-amber-600"
                )}
            >
                <AlertTriangle size={16} />
                <span className="text-sm font-bold whitespace-nowrap">
                    {zones.length} OVERLOAD ZONE{zones.length > 1 ? 'S' : ''}
                </span>
                <ChevronDown size={14} className={cn("transition-transform", showDetails && "rotate-180")} />
            </button>

            {showDetails && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-800/50 p-3 border-b border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Hotspots</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {zones.map(zone => (
                            <div key={zone.id} className="p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white text-sm">{zone.areaName}</span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                                        zone.severity === 'critical' ? "bg-red-900/50 text-red-200" : "bg-amber-900/50 text-amber-200"
                                    )}>
                                        {zone.severity}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Layers size={12} />
                                        <span>{zone.incidentCount} Incidents</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        <span>~{zone.radius.toFixed(1)} mi</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverloadZoneAlert;