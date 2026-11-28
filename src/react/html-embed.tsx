import { useEffect, useRef, useState } from 'react';
import { parseFragment, serialize } from 'parse5';
import { useIsDarkMode } from './use-is-dark-mode.js';

const resizeScript = `(() => {
    let previousHeight = 0;
    let measuredHeight = 0;
    let viewportWidth = innerWidth;
    let viewportHeight = innerHeight;
    let pending = false;
    const report = () => {
        pending = false;
        const body = document.body.getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
        let bottom = body.height;
        for (const element of document.body.querySelectorAll('*')) {
            if (element.getClientRects().length) {
                bottom = Math.max(bottom, element.getBoundingClientRect().bottom - body.top + padding);
            }
        }
        const height = Math.ceil(bottom);
        const ownResize = innerWidth === viewportWidth && innerHeight !== viewportHeight
            && Math.abs(innerHeight - previousHeight) <= 1;
        viewportWidth = innerWidth;
        viewportHeight = innerHeight;
        const changed = height !== measuredHeight;
        measuredHeight = height;
        // Record the resulting layout without feeding viewport-driven growth back to the parent.
        if (!ownResize && changed && height > 0 && height !== previousHeight) {
            previousHeight = height;
            parent.postMessage({ type: 'inkstream:html-embed:resize', height }, '*');
        }
    };
    const schedule = () => {
        if (!pending) {
            pending = true;
            requestAnimationFrame(report);
        }
    };
    window.addEventListener('message', event => {
        if (event.source === parent && event.data?.type === 'inkstream:html-embed:measure') {
            previousHeight = 0;
            measuredHeight = 0;
            schedule();
        }
    });
    const observer = new ResizeObserver(schedule);
    const observe = () => {
        observer.disconnect();
        observer.observe(document.body);
        for (const element of document.body.querySelectorAll('*')) observer.observe(element);
        schedule();
    };
    new MutationObserver(records => {
        if (records.some(record => record.type === 'childList')) observe();
        else schedule();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    observe();
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.addEventListener('load', schedule, true);
    schedule();
})();`;
const resizeScriptHash = 'sha256-Oj/uPkTlFjJHYm7nu1vC/gwOx4YkN6Ywz8hl20md2ts=';

const elements = new Set('div span p br hr h1 h2 h3 h4 h5 h6 ul ol li dl dt dd table thead tbody tfoot tr th td caption colgroup col strong em b i u s small sub sup pre code blockquote figure figcaption details summary label input img style svg g path rect circle ellipse line polyline polygon text tspan defs linearGradient radialGradient stop clipPath mask pattern title desc use symbol'.toLowerCase().split(' '));
const attributes = new Set('class id style title role aria-label aria-hidden width height viewbox fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray opacity fill-opacity stroke-opacity d x y x1 x2 y1 y2 cx cy r rx ry points transform xmlns offset stop-color stop-opacity gradientunits gradienttransform preserveaspectratio clippathunits clip-path mask patternunits patterntransform font-size font-family text-anchor dominant-baseline colspan rowspan scope alt for name value checked open type'.split(' '));

/** Parse before filtering: never interpolate untrusted source into the host DOM. */
export function createHtmlEmbedDocument(source: string, dark: boolean): string {
    const tree = parseFragment(source);
    function clean(parent: typeof tree): void {
        parent.childNodes = parent.childNodes.flatMap(node => {
            if ('tagName' in node && node.tagName.toLowerCase() === 'a') {
                clean(node as unknown as typeof tree);
                return node.childNodes;
            }
            return [node];
        });
        parent.childNodes = parent.childNodes.filter(node => {
            if (node.nodeName === '#text') return true;
            if (!('tagName' in node)) return false;
            const tag = node.tagName.toLowerCase();
            if (!elements.has(tag)) return false;
            const attrs = node.attrs;
            if (tag === 'input' && !attrs.some(a => a.name === 'type' && /^(checkbox|radio)$/i.test(a.value))) return false;
            if (tag === 'style' && attrs.some(a => a.name === 'data-theme' && a.value !== (dark ? 'dark' : 'light'))) return false;
            node.attrs = attrs.filter(a => {
                if (a.namespace || a.prefix) return false;
                if (tag === 'img' && a.name === 'src') return /^(https?:\/\/|data:image\/)/i.test(a.value);
                return attributes.has(a.name.toLowerCase());
            });
            if ('childNodes' in node) clean(node as unknown as typeof tree);
            return true;
        });
    }
    clean(tree);
    const policy = `default-src 'none'; script-src '${resizeScriptHash}'; style-src 'unsafe-inline'; img-src http: https: data:; font-src 'none'; base-uri 'none'; form-action 'none'`;
    return `<!doctype html><html data-theme="${dark ? 'dark' : 'light'}" style="color-scheme:${dark ? 'dark' : 'light'}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>body{display:flow-root;margin:0;padding:16px}img{max-width:100%}</style></head><body>${serialize(tree)}<script>${resizeScript}</script></body></html>`;
}

export function HtmlEmbed({ source }: { source: string }) {
    const dark = useIsDarkMode();
    const iframe = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(500);

    useEffect(() => {
        const resize = (event: MessageEvent) => {
            if (event.source !== iframe.current?.contentWindow) return;
            const data: unknown = event.data;
            if (!data || typeof data !== 'object') return;
            const message = data as { type?: unknown; height?: unknown };
            if (message.type !== 'inkstream:html-embed:resize' || typeof message.height !== 'number' || !Number.isFinite(message.height) || message.height <= 0) return;
            setHeight(Math.min(100000, Math.ceil(message.height)));
        };
        const frame = iframe.current;
        const measure = () => frame?.contentWindow?.postMessage({ type: 'inkstream:html-embed:measure' }, '*');
        window.addEventListener('message', resize);
        frame?.addEventListener('load', measure);
        measure();
        return () => {
            window.removeEventListener('message', resize);
            frame?.removeEventListener('load', measure);
        };
    }, []);
    if (new TextEncoder().encode(source).length > 50 * 1024) {
        return <div role="alert">HTML embeds support up to 50 KiB.</div>;
    }
    return <figure className="ink-html-embed" style={{ margin: '1em 0', border: '1px solid currentColor', borderRadius: 8, overflow: 'hidden' }}>
        <figcaption style={{ padding: '4px 12px', fontSize: 12 }}>User-created content</figcaption>
        <iframe ref={iframe} title="User-created HTML diagram" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={createHtmlEmbedDocument(source, dark)} style={{ display: 'block', width: '100%', height, border: 0 }} />
    </figure>;
}
