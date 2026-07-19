import type { RefObject } from 'react';
export interface ChartColors {
    grid: string;
    text: string;
    fill: string;
    stroke: string;
    cursor: string;
    tooltipBg: string;
}
/**
 * Reads the --ink-chart-* custom properties off the chart's own
 * container so recharts -- which needs real color strings as SVG props,
 * not CSS classes -- can pick up a consumer's plain-CSS override the
 * same way every other ink-* element already can. Re-reads whenever
 * `isDark` changes, since that's driven by the same `.dark`-ancestor
 * class toggle the CSS itself keys off of.
 */
export declare function useChartColors(containerRef: RefObject<HTMLElement | null>, isDark: boolean): ChartColors;
//# sourceMappingURL=use-chart-colors.d.ts.map