import React from 'react';
import { Loader } from 'lucide-react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    className = '',
    disabled = false,
    loading = false,
    type = 'button',
    icon: Icon
}) => {
    return (
        <button
            type={type}
            className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? (
                <Loader size={18} className="btn-spinner" />
            ) : (
                Icon && <Icon size={18} className="btn-icon" />
            )}
            {children}
        </button>
    );
};

export default Button;
