import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Radio } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import './AlertBanner.css';

const AlertBanner = () => {
    const { criticalAlert, dismissCriticalAlert } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (criticalAlert) {
            setIsVisible(true);
        }
    }, [criticalAlert]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            dismissCriticalAlert();
        }, 300);
    };

    if (!criticalAlert) return null;

    return (
        <div className={`alert-banner ${isVisible ? 'visible' : ''}`}>
            <div className="alert-content">
                <div className="alert-icon">
                    <AlertTriangle size={20} />
                </div>
                <div className="alert-text">
                    <span className="alert-label">CRITICAL ALERT</span>
                    <span className="alert-message">{criticalAlert.message}</span>
                </div>
                <div className="alert-pulse">
                    <Radio size={16} />
                    <span>LIVE</span>
                </div>
            </div>
            <button className="alert-dismiss" onClick={handleDismiss}>
                <X size={18} />
            </button>
        </div>
    );
};

export default AlertBanner;
