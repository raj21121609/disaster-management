import React, { useState, useEffect } from 'react';
import {
    Sliders, Clock, Heart, AlertTriangle, TrendingUp, TrendingDown,
    Truck, Plane, Shield, Activity, RotateCcw, Play, Zap
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import {
    simulateResponse,
    generateScenarioPresets,
    compareScenarios
} from '../services/responseSimulationService';
import './ResponseSimulator.css';

const ResponseSimulator = ({ incident, onClose }) => {
    const [config, setConfig] = useState({
        ambulanceCount: 1,
        fireCount: 0,
        policeCount: 0,
        rescueCount: 0,
        helicopterAvailable: false,
        delayMinutes: 0
    });
    
    const [simulation, setSimulation] = useState(null);
    const [presets, setPresets] = useState([]);
    const [activePreset, setActivePreset] = useState(null);
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonResults, setComparisonResults] = useState([]);

    useEffect(() => {
        if (incident) {
            const scenarioPresets = generateScenarioPresets(incident);
            setPresets(scenarioPresets);
            // Start with standard response
            if (scenarioPresets[1]) {
                setConfig(scenarioPresets[1].config);
                setActivePreset(1);
            }
        }
    }, [incident]);

    useEffect(() => {
        if (incident) {
            const result = simulateResponse(incident, config);
            setSimulation(result);
        }
    }, [incident, config]);

    const handleSliderChange = (resource, value) => {
        setConfig(prev => ({ ...prev, [resource]: value }));
        setActivePreset(null);
    };

    const handlePresetClick = (preset, index) => {
        setConfig(preset.config);
        setActivePreset(index);
    };

    const runComparison = () => {
        const results = compareScenarios(incident, presets);
        setComparisonResults(results);
        setComparisonMode(true);
    };

    const getRiskColor = (riskLevel) => {
        const colors = {
            critical: '#ef4444',
            high: '#f59e0b',
            moderate: '#3b82f6',
            low: '#10b981'
        };
        return colors[riskLevel] || '#6b7280';
    };

    const getSurvivalColor = (probability) => {
        if (probability >= 80) return '#10b981';
        if (probability >= 60) return '#3b82f6';
        if (probability >= 40) return '#f59e0b';
        return '#ef4444';
    };

    if (!incident || !simulation) return null;

    return (
        <div className="response-simulator">
            {/* Header */}
            <div className="simulator-header">
                <div className="header-title">
                    <Sliders size={20} />
                    <span>What-If Response Simulator</span>
                </div>
                <div className="header-badge">
                    <Zap size={12} />
                    Predictive Analysis
                </div>
            </div>

            {/* Incident Context */}
            <div className="incident-context">
                <span className={`context-type type-${incident.type}`}>
                    {incident.type?.toUpperCase()}
                </span>
                <span className={`context-severity sev-${incident.severity}`}>
                    {incident.severity?.toUpperCase()}
                </span>
            </div>

            {!comparisonMode ? (
                <>
                    {/* Resource Controls */}
                    <div className="resource-controls">
                        <h4 className="section-title">Adjust Resources</h4>
                        
                        <div className="slider-group">
                            <div className="slider-header">
                                <span className="slider-label">🚑 Ambulances</span>
                                <span className="slider-value">{config.ambulanceCount}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="4"
                                value={config.ambulanceCount}
                                onChange={(e) => handleSliderChange('ambulanceCount', parseInt(e.target.value))}
                                className="slider ambulance-slider"
                            />
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span className="slider-label">🚒 Fire Engines</span>
                                <span className="slider-value">{config.fireCount}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="4"
                                value={config.fireCount}
                                onChange={(e) => handleSliderChange('fireCount', parseInt(e.target.value))}
                                className="slider fire-slider"
                            />
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span className="slider-label">🚔 Police Units</span>
                                <span className="slider-value">{config.policeCount}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="4"
                                value={config.policeCount}
                                onChange={(e) => handleSliderChange('policeCount', parseInt(e.target.value))}
                                className="slider police-slider"
                            />
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span className="slider-label">🦺 Rescue Teams</span>
                                <span className="slider-value">{config.rescueCount}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                value={config.rescueCount}
                                onChange={(e) => handleSliderChange('rescueCount', parseInt(e.target.value))}
                                className="slider rescue-slider"
                            />
                        </div>

                        <div className="toggle-group">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={config.helicopterAvailable}
                                    onChange={(e) => handleSliderChange('helicopterAvailable', e.target.checked)}
                                />
                                <span className="toggle-switch"></span>
                                <span>🚁 Air Medical Transport</span>
                            </label>
                        </div>

                        <div className="slider-group delay-slider">
                            <div className="slider-header">
                                <span className="slider-label">⏱️ Delay (minutes)</span>
                                <span className="slider-value delay-value">+{config.delayMinutes} min</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="15"
                                value={config.delayMinutes}
                                onChange={(e) => handleSliderChange('delayMinutes', parseInt(e.target.value))}
                                className="slider"
                            />
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="presets-section">
                        <h4 className="section-title">Quick Scenarios</h4>
                        <div className="presets-grid">
                            {presets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    className={`preset-btn ${activePreset === idx ? 'active' : ''}`}
                                    onClick={() => handlePresetClick(preset, idx)}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Simulation Results */}
                    <div className="simulation-results">
                        <h4 className="section-title">Predicted Outcome</h4>
                        
                        <div className="results-grid">
                            <div className="result-card">
                                <Clock size={24} className="result-icon" />
                                <div className="result-value">{simulation.responseTime} min</div>
                                <div className="result-label">Response Time</div>
                                <div className={`result-indicator ${simulation.responseTime <= simulation.optimalTime ? 'good' : simulation.responseTime <= simulation.criticalThreshold ? 'warning' : 'bad'}`}>
                                    {simulation.responseTime <= simulation.optimalTime ? '✓ Optimal' : 
                                     simulation.responseTime <= simulation.criticalThreshold ? '⚠ Acceptable' : '✗ Critical'}
                                </div>
                            </div>

                            <div className="result-card">
                                <Heart size={24} className="result-icon" style={{ color: getSurvivalColor(simulation.survivalProbability) }} />
                                <div className="result-value" style={{ color: getSurvivalColor(simulation.survivalProbability) }}>
                                    {simulation.survivalProbability}%
                                </div>
                                <div className="result-label">Success Probability</div>
                                <div className="survival-bar">
                                    <div 
                                        className="survival-fill"
                                        style={{ 
                                            width: `${simulation.survivalProbability}%`,
                                            backgroundColor: getSurvivalColor(simulation.survivalProbability)
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="result-card">
                                <AlertTriangle size={24} style={{ color: getRiskColor(simulation.riskLevel) }} />
                                <div className="result-value" style={{ color: getRiskColor(simulation.riskLevel) }}>
                                    {simulation.riskLevel.toUpperCase()}
                                </div>
                                <div className="result-label">Risk Level</div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="recommendations">
                            <h5>AI Recommendations</h5>
                            <ul className="rec-list">
                                {simulation.recommendations.map((rec, idx) => (
                                    <li key={idx} className={`rec-item priority-${rec.priority}`}>
                                        <span className="rec-action">{rec.action}</span>
                                        <span className="rec-suggestion">→ {rec.suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Compare All Button */}
                    <div className="simulator-actions">
                        <Button 
                            variant="secondary" 
                            icon={Play}
                            onClick={runComparison}
                            fullWidth
                        >
                            Compare All Scenarios
                        </Button>
                    </div>
                </>
            ) : (
                /* Comparison Mode */
                <div className="comparison-view">
                    <div className="comparison-header">
                        <h4>Scenario Comparison</h4>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => setComparisonMode(false)}
                        >
                            Back to Simulator
                        </Button>
                    </div>

                    <div className="comparison-table">
                        <div className="table-header">
                            <div className="col-scenario">Scenario</div>
                            <div className="col-time">Response</div>
                            <div className="col-survival">Success %</div>
                            <div className="col-risk">Risk</div>
                        </div>
                        {comparisonResults.map((result, idx) => (
                            <div 
                                key={idx} 
                                className={`table-row ${result.survivalProbability >= 80 ? 'best' : ''}`}
                            >
                                <div className="col-scenario">
                                    <span className="scenario-name">{result.name}</span>
                                </div>
                                <div className="col-time">
                                    <span className={result.responseTime <= result.optimalTime ? 'text-success' : ''}>
                                        {result.responseTime} min
                                    </span>
                                </div>
                                <div className="col-survival">
                                    <div className="mini-bar">
                                        <div 
                                            className="mini-fill"
                                            style={{ 
                                                width: `${result.survivalProbability}%`,
                                                backgroundColor: getSurvivalColor(result.survivalProbability)
                                            }}
                                        ></div>
                                    </div>
                                    <span style={{ color: getSurvivalColor(result.survivalProbability) }}>
                                        {result.survivalProbability}%
                                    </span>
                                </div>
                                <div className="col-risk">
                                    <span 
                                        className="risk-badge"
                                        style={{ 
                                            backgroundColor: `${getRiskColor(result.riskLevel)}20`,
                                            color: getRiskColor(result.riskLevel)
                                        }}
                                    >
                                        {result.riskLevel}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="comparison-insight">
                        <Zap size={14} />
                        <span>
                            Best outcome: <strong>
                                {comparisonResults.reduce((best, curr) => 
                                    curr.survivalProbability > best.survivalProbability ? curr : best
                                ).name}
                            </strong> with {Math.max(...comparisonResults.map(r => r.survivalProbability))}% success probability
                        </span>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="simulator-footer">
                <span className="footer-note">
                    <Activity size={12} />
                    Simulation based on historical response data
                </span>
            </div>
        </div>
    );
};

export default ResponseSimulator;
