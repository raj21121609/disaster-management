import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
// import './AISeverityBadge.css'; // REMOVED

const AISeverityBadge = ({ severity, priorityScore, showScore = true, size = 'md' }) => {

    const getColors = () => {
        switch (severity) {
            case 'critical': return 'bg-red-500 border-red-500 text-red-500';
            case 'high': return 'bg-amber-500 border-amber-500 text-amber-500';
            case 'medium': return 'bg-blue-500 border-blue-500 text-blue-500';
            case 'low': return 'bg-emerald-500 border-emerald-500 text-emerald-500';
            default: return 'bg-slate-500 border-slate-500 text-slate-500';
        }
    };

    const colors = getColors();

    return (
        <div className={cn(
            "rounded-lg border overflow-hidden bg-slate-900 shadow-sm inline-flex flex-col",
            size === 'lg' ? "w-32" : size === 'sm' ? "w-20" : "w-24",
            colors.split(' ')[1] // Border color
        )}>
            <div className="flex items-center justify-between px-1.5 py-1 bg-slate-950/50 border-b border-slate-800">
                <Brain size={size === 'sm' ? 10 : 12} className="text-slate-400" />
                <span className="text-[8px] font-mono text-slate-500">AI</span>
                <Zap size={size === 'sm' ? 8 : 10} className="text-amber-400" />
            </div>

            <div className="text-center p-1 bg-slate-900">
                <span className={cn(
                    "block font-bold leading-none tracking-tight",
                    size === 'lg' ? "text-sm" : "text-[10px]",
                    colors.split(' ')[2] // Text color
                )}>
                    {severity?.toUpperCase() || 'N/A'}
                </span>

                {showScore && priorityScore !== undefined && (
                    <div className="mt-0.5 flex justify-center items-baseline text-[8px] text-slate-400 font-mono">
                        <span className="text-white">{priorityScore}</span>
                        <span className="opacity-50">/100</span>
                    </div>
                )}
            </div>

            {/* Score Bar */}
            <div className="h-1 w-full bg-slate-800">
                <div
                    className={cn("h-full transition-all", colors.split(' ')[0])}
                    style={{ width: `${priorityScore || 0}%` }}
                ></div>
            </div>
        </div>
    );
};

export default AISeverityBadge;
