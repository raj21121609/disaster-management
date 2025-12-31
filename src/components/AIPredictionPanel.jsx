import React, { useState, useEffect } from 'react';
import { 
    Brain, Truck, Users, Clock, AlertTriangle, 
    CheckCircle, Package, Lightbulb, TrendingUp,
    RefreshCw, Zap
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { predictResources } from '../services/aiPredictionService';
import './AIPredictionPanel.css';

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
        <div className="ai-prediction-panel">
            <div className="panel-header">
                <div className="header-title">
                    <Brain size={20} className="text-info" />
                    <h3>AI Resource Prediction</h3>
                </div>
                <div className="header-badge">
                    <Zap size={12} />
                    Powered by CRISIS.ONE AI
                </div>
            </div>

            <div className="incident-context">
                <span className={`context-badge severity-${incident.severity}`}>
                    {incident.severity?.toUpperCase()}
                </span>
                <span className="context-type">
                    {incident.type?.charAt(0).toUpperCase() + incident.type?.slice(1)} Emergency
                </span>
            </div>

            {loading ? (
                <div className="loading-state">
                    <RefreshCw className="spin" size={32} />
                    <p>Analyzing incident...</p>
                    <span className="loading-sub">Generating resource predictions</span>
                </div>
            ) : error ? (
                <div className="error-state">
                    <AlertTriangle size={32} className="text-warning" />
                    <p>{error}</p>
                    <Button variant="secondary" size="sm" onClick={loadPrediction}>
                        Retry
                    </Button>
                </div>
            ) : prediction && (
                <>
                    {/* Risk Assessment */}
                    <div className={`risk-assessment risk-${incident.severity}`}>
                        <AlertTriangle size={18} />
                        <span>{prediction.riskAssessment}</span>
                    </div>

                    {/* Key Metrics */}
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <Clock size={20} className="text-info" />
                            <div className="metric-value">{prediction.estimatedResponseTime} min</div>
                            <div className="metric-label">Est. Response</div>
                        </div>
                        <div className="metric-card">
                            <Users size={20} className="text-success" />
                            <div className="metric-value">{prediction.requiredPersonnel}</div>
                            <div className="metric-label">Personnel</div>
                        </div>
                        <div className="metric-card">
                            <TrendingUp size={20} className="text-warning" />
                            <div className="metric-value">{prediction.confidence}%</div>
                            <div className="metric-label">Confidence</div>
                        </div>
                    </div>

                    {/* Required Resources */}
                    <div className="section">
                        <h4 className="section-title">
                            <Truck size={16} />
                            Required Resources
                        </h4>
                        <div className="resources-list">
                            {prediction.resources.map((resource, index) => (
                                <div 
                                    key={index} 
                                    className={`resource-item priority-${resource.priority}`}
                                >
                                    <span className="resource-icon">{resource.icon}</span>
                                    <div className="resource-info">
                                        <span className="resource-name">{resource.type}</span>
                                        <span className={`resource-priority priority-${resource.priority}`}>
                                            {resource.priority}
                                        </span>
                                    </div>
                                    <span className="resource-quantity">×{resource.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Required Supplies */}
                    {prediction.supplies && prediction.supplies.length > 0 && (
                        <div className="section">
                            <h4 className="section-title">
                                <Package size={16} />
                                Required Supplies
                            </h4>
                            <div className="supplies-grid">
                                {prediction.supplies.map((supply, index) => (
                                    <div key={index} className="supply-item">
                                        <span className="supply-name">{supply.name}</span>
                                        <span className="supply-qty">×{supply.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Recommendations */}
                    <div className="section">
                        <h4 className="section-title">
                            <Lightbulb size={16} />
                            AI Recommendations
                        </h4>
                        <ul className="recommendations-list">
                            {prediction.recommendations.map((rec, index) => (
                                <li key={index} className="recommendation-item">
                                    <CheckCircle size={14} className="text-success" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="panel-actions">
                        <Button 
                            variant="primary" 
                            fullWidth
                            icon={Truck}
                        >
                            Auto-Dispatch Resources
                        </Button>
                        <Button 
                            variant="secondary" 
                            fullWidth
                            onClick={loadPrediction}
                            icon={RefreshCw}
                        >
                            Refresh Prediction
                        </Button>
                    </div>

                    <div className="ai-footer">
                        <span>Model: {prediction.aiModel || 'CRISIS.ONE AI v1.0'}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIPredictionPanel;
