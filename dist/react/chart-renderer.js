import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { parseJsonProp } from '../parse-json-prop.js';
import { useChartColors } from './use-chart-colors.js';
import { useIsDarkMode } from './use-is-dark-mode.js';
function getChartDomain(config) {
    const min = config.min ?? 0;
    const max = config.max ?? Math.max(...config.data.map((point) => point.value));
    if (max <= min) {
        return [min, min + 1];
    }
    return [min, max];
}
/**
 * Renders a `chart` code fence via recharts. Kept in its own module (like
 * MermaidDiagram) and loaded through a lazy import from
 * default-components.tsx, since recharts is an optional peer dependency
 * and a sizeable bundle that consumers who never use charts shouldn't be
 * forced to install.
 */
export function ChartRenderer({ chart }) {
    const config = parseJsonProp(chart);
    const isDark = useIsDarkMode();
    const containerRef = useRef(null);
    const colors = useChartColors(containerRef, isDark);
    if (!config) {
        return null;
    }
    const tooltipStyle = {
        background: colors.tooltipBg,
        border: `1px solid ${colors.grid}`,
        borderRadius: '8px',
        fontSize: '12px',
        color: colors.text,
    };
    const [domainMin, domainMax] = getChartDomain(config);
    return (_jsxs("div", { className: "ink-chart", ref: containerRef, children: [config.title && _jsx("p", { className: "ink-chart-title", children: config.title }), config.type === 'bar' ? (_jsx(ResponsiveContainer, { width: "100%", height: config.data.length * 44 + 60, children: _jsxs(BarChart, { layout: "vertical", data: config.data, margin: { top: 4, right: 16, bottom: 4, left: 8 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: false, stroke: colors.grid }), _jsx(XAxis, { type: "number", domain: [domainMin, domainMax], tick: { fill: colors.text, fontSize: 12 }, axisLine: { stroke: colors.grid }, tickLine: false }), _jsx(YAxis, { type: "category", dataKey: "label", width: 96, tick: { fill: colors.text, fontSize: 12 }, axisLine: false, tickLine: false }), _jsx(Tooltip, { cursor: { fill: colors.cursor }, contentStyle: tooltipStyle }), _jsx(Bar, { dataKey: "value", fill: colors.fill, radius: [0, 4, 4, 0] })] }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 340, children: _jsxs(RadarChart, { data: config.data, children: [_jsx(PolarGrid, { stroke: colors.grid }), _jsx(PolarAngleAxis, { dataKey: "label", tick: { fill: colors.text, fontSize: 12 } }), _jsx(PolarRadiusAxis, { domain: [domainMin, domainMax], tick: { fill: colors.text, fontSize: 10 }, axisLine: false }), _jsx(Radar, { dataKey: "value", stroke: colors.stroke, fill: colors.fill, fillOpacity: 0.35 }), _jsx(Tooltip, { contentStyle: tooltipStyle })] }) }))] }));
}
//# sourceMappingURL=chart-renderer.js.map