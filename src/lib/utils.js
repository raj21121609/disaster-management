import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge tailwind classes without conflicts
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
