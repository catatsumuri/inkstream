export declare function createMermaidConfig(isDark: boolean): {
    startOnLoad: boolean;
    securityLevel: "strict";
    theme: "redux-dark-color" | "redux-color";
    look: "neo";
    layout: string;
};
/**
 * Renders a ` ```mermaid ` fence as an SVG diagram. This module imports
 * mermaid statically but is only ever loaded through the lazy import in
 * code-block.tsx, so the (large) mermaid bundle stays in its own chunk and
 * is fetched on first use.
 */
export declare function MermaidDiagram({ code }: {
    code: string;
}): import("react").JSX.Element;
//# sourceMappingURL=mermaid-diagram.d.ts.map