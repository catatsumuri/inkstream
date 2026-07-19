import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import Markdown from 'react-markdown';
import { createHeadingIdDispenser } from '../heading-id-dispenser.js';
import { normalizeInkstreamMarkdown } from '../normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../remark-plugins.js';
import { remarkWikilinks } from '../remark-wikilinks.js';
import { inkstreamDefaultComponents } from './default-components.js';
import { OgpEndpointContext } from './embed-components.js';
import { HeadingIdContext } from './heading-components.js';
/**
 * Drop-in renderer for inkstream-flavoured markdown: runs the string-level
 * normalizers and the full remark plugin chain, and renders every custom
 * element with unstyled defaults that carry stable `ink-*` class names.
 */
export function InkstreamMarkdown({ children, className, components, headingIdPrefix, ogpEndpoint, resolveWikilink, }) {
    // A fresh dispenser per render pass keeps duplicate-heading numbering
    // deterministic across re-renders.
    const dispenseHeadingId = createHeadingIdDispenser();
    // remarkWikilinks is only added when a resolver is supplied, appended
    // after remarkLinkifyToCard so a lone `[[path]]` paragraph is never
    // mistaken for a standalone-URL embed.
    const remarkPlugins = useMemo(() => resolveWikilink
        ? [...inkstreamRemarkPlugins, [remarkWikilinks, resolveWikilink]]
        : inkstreamRemarkPlugins, [resolveWikilink]);
    return (_jsx(HeadingIdContext.Provider, { value: { dispense: dispenseHeadingId, prefix: headingIdPrefix }, children: _jsx(OgpEndpointContext.Provider, { value: ogpEndpoint, children: _jsx("div", { className: className ? `ink-markdown ${className}` : 'ink-markdown', children: _jsx(Markdown, { remarkPlugins: remarkPlugins, components: {
                        ...inkstreamDefaultComponents,
                        ...components,
                    }, children: normalizeInkstreamMarkdown(children) }) }) }) }));
}
//# sourceMappingURL=inkstream-markdown.js.map