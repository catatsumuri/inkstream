import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

export interface ChartColors {
    grid: string;
    text: string;
    fill: string;
    stroke: string;
    cursor: string;
    tooltipBg: string;
}

const CHART_COLOR_VARS: Record<keyof ChartColors, string> = {
    grid: '--ink-chart-grid',
    text: '--ink-chart-text',
    fill: '--ink-chart-fill',
    stroke: '--ink-chart-stroke',
    cursor: '--ink-chart-cursor',
    tooltipBg: '--ink-chart-tooltip-bg',
};

/**
 * inkstream's own opinionated chart palette, matching styles.css's
 * `.ink-chart` / `.ink-chart:is(.dark *)` defaults. Used as the initial
 * render (before the container is mounted) and whenever a --ink-chart-*
 * property isn't set at all, e.g. styles.css isn't imported.
 */
const FALLBACKS: Record<'light' | 'dark', ChartColors> = {
    light: {
        grid: '#e5e7eb',
        text: '#6b7280',
        fill: '#4f46e5',
        stroke: '#4338ca',
        cursor: '#f3f4f6',
        tooltipBg: '#ffffff',
    },
    dark: {
        grid: '#374151',
        text: '#9ca3af',
        fill: '#818cf8',
        stroke: '#6366f1',
        cursor: '#1f2937',
        tooltipBg: '#111827',
    },
};

/**
 * Reads the --ink-chart-* custom properties off the chart's own
 * container so recharts -- which needs real color strings as SVG props,
 * not CSS classes -- can pick up a consumer's plain-CSS override the
 * same way every other ink-* element already can. Re-reads whenever
 * `isDark` changes, since that's driven by the same `.dark`-ancestor
 * class toggle the CSS itself keys off of.
 */
export function useChartColors(
    containerRef: RefObject<HTMLElement | null>,
    isDark: boolean,
): ChartColors {
    const [colors, setColors] = useState<ChartColors>(
        FALLBACKS[isDark ? 'dark' : 'light'],
    );

    useEffect(() => {
        const element = containerRef.current;
        const fallback = FALLBACKS[isDark ? 'dark' : 'light'];

        if (!element || typeof window === 'undefined') {
            setColors(fallback);

            return;
        }

        const computed = window.getComputedStyle(element);
        const next = { ...fallback };

        for (const key of Object.keys(CHART_COLOR_VARS) as (keyof ChartColors)[]) {
            const value = computed.getPropertyValue(CHART_COLOR_VARS[key]).trim();

            if (value) {
                next[key] = value;
            }
        }

        setColors(next);
    }, [containerRef, isDark]);

    return colors;
}
