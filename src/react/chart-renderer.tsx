import { useRef } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartConfig } from '../parse-chart-fence.js';
import { parseJsonProp } from '../parse-json-prop.js';
import type { InkstreamElementProps } from './default-components.js';
import { useChartColors } from './use-chart-colors.js';
import { useIsDarkMode } from './use-is-dark-mode.js';

function getChartDomain(config: ChartConfig): [number, number] {
    const min = config.min ?? 0;
    const max =
        config.max ?? Math.max(...config.data.map((point) => point.value));

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
export function ChartRenderer({ chart }: InkstreamElementProps) {
    const config = parseJsonProp<ChartConfig>(chart);
    const isDark = useIsDarkMode();
    const containerRef = useRef<HTMLDivElement>(null);
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

    return (
        <div className="ink-chart" ref={containerRef}>
            {config.title && <p className="ink-chart-title">{config.title}</p>}
            {config.type === 'bar' ? (
                <ResponsiveContainer
                    width="100%"
                    height={config.data.length * 44 + 60}
                >
                    <BarChart
                        layout="vertical"
                        data={config.data}
                        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke={colors.grid}
                        />
                        <XAxis
                            type="number"
                            domain={[domainMin, domainMax]}
                            tick={{ fill: colors.text, fontSize: 12 }}
                            axisLine={{ stroke: colors.grid }}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={96}
                            tick={{ fill: colors.text, fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: colors.cursor }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar
                            dataKey="value"
                            fill={colors.fill}
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={config.data}>
                        <PolarGrid stroke={colors.grid} />
                        <PolarAngleAxis
                            dataKey="label"
                            tick={{ fill: colors.text, fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            domain={[domainMin, domainMax]}
                            tick={{ fill: colors.text, fontSize: 10 }}
                            axisLine={false}
                        />
                        <Radar
                            dataKey="value"
                            stroke={colors.stroke}
                            fill={colors.fill}
                            fillOpacity={0.35}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
