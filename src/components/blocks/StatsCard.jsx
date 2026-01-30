import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * StatsCard - A command center metric card with mini-chart
 * @param {string} title - Metric name
 * @param {string} value - Main value
 * @param {string} change - % Change (e.g. "+12.5%")
 * @param {string} trend - 'up' | 'down' | 'neutral'
 * @param {Array} data - Tiny chart data
 */
const StatsCard = ({ title, value, change, trend = 'neutral', data, icon: Icon, className }) => {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    // Mock chart data if none provided
    const chartData = data || [
        { v: 10 }, { v: 25 }, { v: 15 }, { v: 30 }, { v: 45 }, { v: 35 }, { v: 55 }
    ];

    return (
        <Card className={cn("bg-slate-900/50 border-slate-800 backdrop-blur overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-slate-500" />}
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold font-mono tracking-tight text-white">{value}</div>
                    {change && (
                        <div className={cn(
                            "flex items-center text-xs font-semibold",
                            isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-slate-500"
                        )}>
                            {isPositive ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                            {change}
                        </div>
                    )}
                </div>

                {data !== false && (
                    <div className="h-[40px] mt-3 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isNegative ? "#ef4444" : "#3b82f6"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isNegative ? "#ef4444" : "#3b82f6"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="v"
                                    stroke={isNegative ? "#ef4444" : "#3b82f6"}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${title})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StatsCard;
