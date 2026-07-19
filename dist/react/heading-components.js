import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link as LinkIcon } from 'lucide-react';
import { Children, createContext, isValidElement, useContext, useRef, } from 'react';
import { slugify } from '../slugify.js';
/**
 * Provides the per-document id dispenser (and optional id prefix) to the
 * heading renderers. InkstreamMarkdown supplies it; without a provider the
 * renderers fall back to un-deduplicated base ids.
 */
export const HeadingIdContext = createContext(null);
/**
 * Collects the plain text of a rendered heading's children, descending
 * through inline elements and using image alt text, so the slug matches
 * what extractMarkdownHeadings computes from the markdown source.
 */
export function extractRenderedHeadingText(node) {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (typeof node === 'boolean' || node === null || node === undefined) {
        return '';
    }
    if (Array.isArray(node)) {
        return node.map(extractRenderedHeadingText).join('');
    }
    if (!isValidElement(node)) {
        return '';
    }
    if (typeof node.props.alt === 'string' &&
        node.props.children === undefined) {
        return node.props.alt;
    }
    return Children.toArray(node.props.children)
        .map(extractRenderedHeadingText)
        .join('');
}
function copyAnchorUrl(id) {
    if (typeof window === 'undefined') {
        return;
    }
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(window.history.state, '', url);
    void navigator.clipboard?.writeText(url.toString());
}
function makeHeadingRenderer(level) {
    return function Heading({ children }) {
        const context = useContext(HeadingIdContext);
        // Stable per-instance identity so Strict Mode's double-invoke
        // doesn't increment the shared counter twice for the same heading.
        const selfRef = useRef({});
        const text = extractRenderedHeadingText(children);
        const slug = slugify(text);
        const baseId = context?.prefix ? `${context.prefix}-${slug}` : slug;
        const id = context
            ? context.dispense(baseId, selfRef.current)
            : baseId;
        const Tag = `h${level}`;
        return (_jsxs(Tag, { id: id, className: "ink-heading", children: [children, _jsx("a", { href: `#${encodeURIComponent(id)}`, onClick: () => copyAnchorUrl(id), "aria-label": `Copy link to ${text}`, title: "Copy link to this section", className: "ink-heading-anchor", children: _jsx(LinkIcon, { className: "ink-heading-anchor-icon" }) })] }));
    };
}
/**
 * Default renderers for h1–h4: each heading gets a slug-derived id (deep
 * links and tables of contents built from extractMarkdownHeadings resolve
 * to it) and a copy-link anchor. h5/h6 are left to the browser defaults —
 * extractMarkdownHeadings stops at #### too.
 */
export const headingComponents = {
    h1: makeHeadingRenderer(1),
    h2: makeHeadingRenderer(2),
    h3: makeHeadingRenderer(3),
    h4: makeHeadingRenderer(4),
};
//# sourceMappingURL=heading-components.js.map