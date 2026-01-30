import React from 'react';
import { cn } from '../../lib/utils';
import './Switch.css';

/**
 * Switch component for toggling between states (shadcn-style)
 * @param {Object} props
 * @param {boolean} props.checked - Current state
 * @param {function} props.onCheckedChange - Callback when state changes
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.id - Optional ID for accessibility
 */
export function Switch({ checked = false, onCheckedChange, className, id, ...props }) {
    const handleToggle = () => {
        if (onCheckedChange) {
            onCheckedChange(!checked);
        }
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            id={id}
            className={cn('switch', checked && 'switch-checked', className)}
            onClick={handleToggle}
            {...props}
        >
            <span className="switch-thumb" />
        </button>
    );
}

export default Switch;
