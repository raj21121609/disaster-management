import React, { useState, useEffect } from 'react';
import { 
    Brain, Eye, ChevronDown, ChevronUp, CheckCircle, 
    AlertTriangle, Info, Zap, GitBranch, Target, Lightbulb
} from 'lucide-react';
import Card from './Card';
import { 
    explainSeverityDecision, 
    highlightKeywordsInText,
    getConfidenceLabel 
} from '../services/aiExplainabilityService';
import './AIExplainabilityPanel.css';

const AIExplainabilityPanel = ({ incident, showDetails = true }) => {
    const [explanation, setExplanation] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        if (incident) {
            const result = explainSeverityDecision(
                incident.type,
                incident.description
            );
            setExplanation(result);
        }
    }, [incident]);

    if (!explanation) return null;

    const confidenceInfo = getConfidenceLabel(explanation.confidence);

    return (
        <div className="ai-explainability-panel">
            {/* Header */}
            <div className="explainability-header">
                <div className="header-left">
                    <div className="ai-badge">
                        <Brain size={18} />
                        <span>AI Decision Transparency</span>
                    </div>
                    <div 
                        className="confidence-badge"
                        style={{ backgroundColor: `${confidenceInfo.color}20`, color: confidenceInfo.color }}
                    >
                        <Target size={14} />
                        {explanation.confidence}% {confidenceInfo.label} Confidence
                    </div>
                </div>
                <button 
                    className="expand-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Eye size={16} />
                    {isExpanded ? 'Hide Details' : 'Show Why'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Summary Section - Always Visible */}
            <div className="summary-section">
                <div className={`severity-result severity-${explanation.finalSeverity}`}>
                    <div className="severity-label">AI Decision</div>
                    <div className="severity-value">{explanation.finalSeverity.toUpperCase()}</div>
                    <div className="severity-score">{explanation.finalScore}/100</div>
                </div>
                <p className="summary-text">{explanation.summary}</p>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="expanded-section">
                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        <button 
                            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summary')}
                        >
                            <Info size={14} /> Summary
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
                            onClick={() => setActiveTab('keywords')}
                        >
                            <Zap size={14} /> Keywords
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rules')}
                        >
                            <GitBranch size={14} /> Rule Path
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'alternatives' ? 'active' : ''}`}
                            onClick={() => setActiveTab('alternatives')}
                        >
                            <Lightbulb size={14} /> What-If
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'summary' && (
                            <div className="content-summary">
                                {/* Type Analysis */}
                                <div className="analysis-card">
                                    <h4>Incident Type Analysis</h4>
                                    <div className="type-info">
                                        <span className="type-name">{explanation.typeAnalysis.type}</span>
                                        <span className="type-score">Base Score: {explanation.typeAnalysis.baseScore}</span>
                                    </div>
                                    <p className="type-reason">{explanation.typeAnalysis.reason}</p>
                                </div>

                                {/* Decision Factors */}
                                {explanation.decisionFactors.length > 0 && (
                                    <div className="analysis-card">
                                        <h4>Decision Factors</h4>
                                        <ul className="factor-list">
                                            {explanation.decisionFactors.map((factor, idx) => (
                                                <li key={idx} className="factor-item">
                                                    <CheckCircle size={14} className="text-success" />
                                                    <div>
                                                        <span className="factor-name">{factor.factor}</span>
                                                        <span className="factor-impact">{factor.impact}</span>
                                                    </div>
                                                    <span className={`factor-weight weight-${factor.weight.toLowerCase()}`}>
                                                        {factor.weight}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'keywords' && (
                            <div className="content-keywords">
                                {/* Highlighted Text */}
                                {incident.description && (
                                    <div className="highlighted-text">
                                        <h4>Description Analysis</h4>
                                        <p 
                                            className="description-highlight"
                                            dangerouslySetInnerHTML={{ 
                                                __html: highlightKeywordsInText(
                                                    incident.description, 
                                                    explanation.matchedKeywords
                                                ) 
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Matched Keywords */}
                                <div className="keywords-list">
                                    <h4>Detected Keywords ({explanation.matchedKeywords.length})</h4>
                                    {explanation.matchedKeywords.length === 0 ? (
                                        <p className="no-keywords">No specific priority keywords detected. Classification based on incident type.</p>
                                    ) : (
                                        <div className="keyword-grid">
                                            {explanation.matchedKeywords.map((kw, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`keyword-card severity-${kw.severity}`}
                                                    style={{ borderLeftColor: kw.color }}
                                                >
                                                    <div className="keyword-header">
                                                        <span 
                                                            className="keyword-text"
                                                            style={{ color: kw.color }}
                                                        >
                                                            "{kw.keyword}"
                                                        </span>
                                                        <span className={`keyword-severity sev-${kw.severity}`}>
                                                            {kw.severity}
                                                        </span>
                                                    </div>
                                                    <p className="keyword-reason">{kw.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="content-rules">
                                <h4>AI Decision Path</h4>
                                <div className="rule-timeline">
                                    {explanation.rulePath.map((step, idx) => (
                                        <div key={idx} className="rule-step">
                                            <div className="step-marker">
                                                <span className="step-number">{step.step}</span>
                                                <div className="step-line"></div>
                                            </div>
                                            <div className="step-content">
                                                <div className="step-header">
                                                    <span className="step-rule">{step.rule}</span>
                                                </div>
                                                <div className="step-io">
                                                    <div className="io-item">
                                                        <span className="io-label">Input:</span>
                                                        <span className="io-value">{step.input}</span>
                                                    </div>
                                                    <div className="io-item">
                                                        <span className="io-label">Output:</span>
                                                        <span className="io-value output">{step.output}</span>
                                                    </div>
                                                </div>
                                                <p className="step-reason">{step.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'alternatives' && (
                            <div className="content-alternatives">
                                <h4>
                                    <Lightbulb size={16} />
                                    What Could Change This Decision?
                                </h4>
                                {explanation.alternativeScenarios.length === 0 ? (
                                    <p className="no-alternatives">
                                        This incident has been classified at the highest priority level.
                                    </p>
                                ) : (
                                    <div className="alternatives-list">
                                        {explanation.alternativeScenarios.map((alt, idx) => (
                                            <div key={idx} className="alternative-card">
                                                <div className="alt-scenario">
                                                    <AlertTriangle size={14} />
                                                    <span>{alt.scenario}</span>
                                                </div>
                                                <div className="alt-result">
                                                    → {alt.result}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="explainability-footer">
                <span className="footer-note">
                    <Eye size={12} />
                    Full AI transparency - No black-box decisions
                </span>
                <span className="analyzed-time">
                    Analyzed: {new Date(explanation.analyzedAt).toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
};

export default AIExplainabilityPanel;
