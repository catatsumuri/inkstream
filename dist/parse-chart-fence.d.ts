export type ChartType = 'bar' | 'radar';
export interface ChartDataPoint {
    label: string;
    value: number;
}
export interface ChartConfig {
    type: ChartType;
    title?: string;
    min?: number;
    max?: number;
    data: ChartDataPoint[];
}
/**
 * Parses `_title:` / `_min:` / `_max:` / `label: value` lines into a chart
 * config, or null if no data points were found. Ported from inkstream v1's
 * `parseChartContent`.
 */
export declare function parseChartFence(type: ChartType, content: string): ChartConfig | null;
//# sourceMappingURL=parse-chart-fence.d.ts.map