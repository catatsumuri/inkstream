import mermaid from 'mermaid';
import { useEffect, useId, useRef, useState } from 'react';
import { useIsDarkMode } from './use-is-dark-mode.js';

/**
 * Renders a ` ```mermaid ` fence as an SVG diagram. This module imports
 * mermaid statically but is only ever loaded through the lazy import in
 * code-block.tsx, so the (large) mermaid bundle stays in its own chunk and
 * is fetched on first use.
 */
export function MermaidDiagram({ code }: { code: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const renderId = useId().replace(/:/g, '');
    const [error, setError] = useState<string | null>(null);
    const isDark = useIsDarkMode();
    const theme = isDark ? 'dark' : 'default';

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!code.trim()) {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            return;
        }

        let cancelled = false;

        const render = async () => {
            try {
                setError(null);
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    theme,
                });

                const { svg, bindFunctions } = await mermaid.render(
                    `${renderId}-${theme}`,
                    code,
                );

                if (cancelled) {
                    return;
                }

                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;

                    if (bindFunctions) {
                        bindFunctions(containerRef.current);
                    }
                }
            } catch (renderError) {
                if (cancelled) {
                    return;
                }

                setError(
                    renderError instanceof Error
                        ? renderError.message
                        : 'Failed to render mermaid diagram.',
                );
            }
        };

        void render();

        return () => {
            cancelled = true;
        };
    }, [code, renderId, theme]);

    if (error) {
        return (
            <div className="ink-mermaid-error">
                Mermaid render error: {error}
            </div>
        );
    }

    return (
        <div className="ink-mermaid">
            <div ref={containerRef} />
        </div>
    );
}
