import type { InkstreamElementProps } from './default-components.js';
/**
 * Renders a `chart` code fence via recharts. Kept in its own module (like
 * MermaidDiagram) and loaded through a lazy import from
 * default-components.tsx, since recharts is an optional peer dependency
 * and a sizeable bundle that consumers who never use charts shouldn't be
 * forced to install.
 */
export declare function ChartRenderer({ chart }: InkstreamElementProps): import("react").JSX.Element | null;
//# sourceMappingURL=chart-renderer.d.ts.map