import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { parseFragment, serialize } from 'parse5';
import { useIsDarkMode } from './use-is-dark-mode.js';
const elements = new Set('div span p br hr h1 h2 h3 h4 h5 h6 ul ol li dl dt dd table thead tbody tfoot tr th td caption colgroup col strong em b i u s small sub sup pre code blockquote figure figcaption details summary label input img style svg g path rect circle ellipse line polyline polygon text tspan defs linearGradient radialGradient stop clipPath mask pattern title desc use symbol'.toLowerCase().split(' '));
const attributes = new Set('class id style title role aria-label aria-hidden width height viewbox fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray opacity fill-opacity stroke-opacity d x y x1 x2 y1 y2 cx cy r rx ry points transform xmlns offset stop-color stop-opacity gradientunits gradienttransform preserveaspectratio clippathunits clip-path mask patternunits patterntransform font-size font-family text-anchor dominant-baseline colspan rowspan scope alt for name value checked open type'.split(' '));
/** Parse before filtering: never interpolate untrusted source into the host DOM. */
export function createHtmlEmbedDocument(source, dark) {
    const tree = parseFragment(source);
    function clean(parent) {
        parent.childNodes = parent.childNodes.flatMap(node => {
            if ('tagName' in node && node.tagName.toLowerCase() === 'a') {
                clean(node);
                return node.childNodes;
            }
            return [node];
        });
        parent.childNodes = parent.childNodes.filter(node => {
            if (node.nodeName === '#text')
                return true;
            if (!('tagName' in node))
                return false;
            const tag = node.tagName.toLowerCase();
            if (!elements.has(tag))
                return false;
            const attrs = node.attrs;
            if (tag === 'input' && !attrs.some(a => a.name === 'type' && /^(checkbox|radio)$/i.test(a.value)))
                return false;
            if (tag === 'style' && attrs.some(a => a.name === 'data-theme' && a.value !== (dark ? 'dark' : 'light')))
                return false;
            node.attrs = attrs.filter(a => {
                if (a.namespace || a.prefix)
                    return false;
                if (tag === 'img' && a.name === 'src')
                    return /^(https?:\/\/|data:image\/)/i.test(a.value);
                return attributes.has(a.name.toLowerCase());
            });
            if ('childNodes' in node)
                clean(node);
            return true;
        });
    }
    clean(tree);
    const policy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src http: https: data:; font-src 'none'; base-uri 'none'; form-action 'none'";
    return `<!doctype html><html data-theme="${dark ? 'dark' : 'light'}" style="color-scheme:${dark ? 'dark' : 'light'}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>body{margin:0;padding:16px}img{max-width:100%}</style></head><body>${serialize(tree)}</body></html>`;
}
export function HtmlEmbed({ source }) {
    const dark = useIsDarkMode();
    if (new TextEncoder().encode(source).length > 50 * 1024) {
        return _jsx("div", { role: "alert", children: "HTML embeds support up to 50 KiB." });
    }
    return _jsxs("figure", { className: "ink-html-embed", style: { margin: '1em 0', border: '1px solid currentColor', borderRadius: 8, overflow: 'hidden' }, children: [_jsx("figcaption", { style: { padding: '4px 12px', fontSize: 12 }, children: "User-created content" }), _jsx("iframe", { title: "User-created HTML diagram", sandbox: "", referrerPolicy: "no-referrer", srcDoc: createHtmlEmbedDocument(source, dark), style: { display: 'block', width: '100%', height: 500, border: 0 } })] });
}
//# sourceMappingURL=html-embed.js.map