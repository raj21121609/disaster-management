import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design with media queries
 * @param {string} query - Media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        // Set initial value
        setMatches(media.matches);

        // Create listener
        const listener = (event) => {
            setMatches(event.matches);
        };

        // Add listener
        media.addEventListener('change', listener);

        // Cleanup
        return () => {
            media.removeEventListener('change', listener);
        };
    }, [query]);

    return matches;
}

/**
 * Predefined breakpoint hooks
 */
export function useIsMobile() {
    return !useMediaQuery('(min-width: 768px)');
}

export function useIsTablet() {
    return useMediaQuery('(min-width: 768px)') && !useMediaQuery('(min-width: 1024px)');
}

export function useIsDesktop() {
    return useMediaQuery('(min-width: 1024px)');
}
