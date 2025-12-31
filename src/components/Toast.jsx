import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ 
    message, 
    type = 'info', 
    duration = 5000, 
    onClose,
    action = null 
}) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose?.();
        }, 200);
    };

    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`toast toast-${type} ${isExiting ? 'exiting' : ''}`}>
            <div className="toast-icon">
                {icons[type]}
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
                {action && (
                    <button className="toast-action" onClick={action.onClick}>
                        {action.label}
                    </button>
                )}
            </div>
            <button className="toast-close" onClick={handleClose}>
                <X size={16} />
            </button>
            {duration > 0 && (
                <div 
                    className="toast-progress"
                    style={{ animationDuration: `${duration}ms` }}
                />
            )}
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    action={toast.action}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default Toast;
