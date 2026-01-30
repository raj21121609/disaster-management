import React, { useEffect, useRef } from 'react';
import './BackgroundPaths.css';

/**
 * BackgroundPaths - Animated SVG paths background for landing pages
 * Creates flowing, animated curved paths with gradient effects
 * Compatible with dark mode and CRISIS.ONE design system
 */
export function BackgroundPaths({
    className = '',
    pathCount = 5,
    animated = true,
    colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6']
}) {
    const containerRef = useRef(null);

    // Generate smooth curved paths
    const generatePath = (index, total) => {
        const height = 100;
        const width = 100;
        const yOffset = (height / (total + 1)) * (index + 1);
        const amplitude = 15 + Math.random() * 10;
        const frequency = 1.5 + Math.random() * 0.5;

        // Create bezier curve path
        const points = [];
        const segments = 4;

        for (let i = 0; i <= segments; i++) {
            const x = (width / segments) * i;
            const y = yOffset + Math.sin((i / segments) * Math.PI * frequency) * amplitude;
            points.push({ x, y });
        }

        // Build SVG path with smooth curves
        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx1 = prev.x + (curr.x - prev.x) / 3;
            const cpy1 = prev.y;
            const cpx2 = curr.x - (curr.x - prev.x) / 3;
            const cpy2 = curr.y;
            d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
        }

        return d;
    };

    const paths = Array.from({ length: pathCount }, (_, i) => ({
        d: generatePath(i, pathCount),
        color: colors[i % colors.length],
        delay: i * 0.5,
        duration: 8 + i * 2
    }));

    return (
        <div
            ref={containerRef}
            className={`background-paths ${className}`}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="background-paths-svg"
            >
                <defs>
                    {paths.map((path, i) => (
                        <linearGradient
                            key={`gradient-${i}`}
                            id={`path-gradient-${i}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor={path.color} stopOpacity="0" />
                            <stop offset="50%" stopColor={path.color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={path.color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                </defs>

                {paths.map((path, i) => (
                    <path
                        key={i}
                        d={path.d}
                        fill="none"
                        stroke={`url(#path-gradient-${i})`}
                        strokeWidth="0.3"
                        className={animated ? 'path-animated' : ''}
                        style={{
                            animationDelay: `${path.delay}s`,
                            animationDuration: `${path.duration}s`
                        }}
                    />
                ))}
            </svg>

            {/* Additional glow orbs */}
            <div className="background-orb orb-1"></div>
            <div className="background-orb orb-2"></div>
            <div className="background-orb orb-3"></div>
        </div>
    );
}

export default BackgroundPaths;
