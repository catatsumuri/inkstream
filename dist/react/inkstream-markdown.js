import { jsx as _jsx } from "react/jsx-runtime";
import { memo, useMemo } from 'react';
import Markdown from 'react-markdown';
import { createHeadingIdDispenser } from '../heading-id-dispenser.js';
import { normalizeInkstreamMarkdown } from '../normalize-inkstream-markdown.js';
import { createInkstreamRemarkPlugins } from '../remark-plugins.js';
import { remarkWikilinks } from '../remark-wikilinks.js';
import { BlockCompletionContext, remarkBlockCompletion, withBlockCompletion, } from './block-completion.js';
import { inkstreamDefaultComponents } from './default-components.js';
import { OgpEndpointContext } from './embed-components.js';
import { GenerativeUiContext, } from './generative-ui-context.js';
import { useStreamingSource } from './use-streaming-source.js';
import { HeadingIdContext } from './heading-components.js';
const MemoizedMarkdown = memo(Markdown);
/**
 * Drop-in renderer for inkstream-flavoured markdown: runs the string-level
 * normalizers and the full remark plugin chain, and renders every custom
 * element with unstyled defaults that carry stable `ink-*` class names.
 */
export function InkstreamMarkdown({ children, className, components, generativeUi = false, streaming = false, streamingMode = 'document', streamingUpdateInterval = 0, generativeUiValues, onGenerativeUiEvent, headingIdPrefix, ogpEndpoint, resolveWikilink, }) {
    const displayedSource = useStreamingSource(children, streaming, streamingUpdateInterval);
    const normalizedSource = useMemo(() => normalizeInkstreamMarkdown(displayedSource, { generativeUi }), [displayedSource, generativeUi]);
    // A fresh dispenser per render pass keeps duplicate-heading numbering
    // deterministic across re-renders.
    const dispenseHeadingId = createHeadingIdDispenser();
    // remarkWikilinks is only added when a resolver is supplied, appended
    // after remarkLinkifyToCard so a lone `[[path]]` paragraph is never
    // mistaken for a standalone-URL embed.
    const baseRemarkPlugins = useMemo(() => [
        ...createInkstreamRemarkPlugins({ generativeUi }),
        ...(generativeUi ? [remarkBlockCompletion] : []),
    ], [generativeUi]);
    const remarkPlugins = useMemo(() => resolveWikilink
        ? [...baseRemarkPlugins, [remarkWikilinks, resolveWikilink]]
        : baseRemarkPlugins, [baseRemarkPlugins, resolveWikilink]);
    const renderedComponents = useMemo(() => withBlockCompletion({ ...inkstreamDefaultComponents, ...components }), [components]);
    return (_jsx(HeadingIdContext.Provider, { value: { dispense: dispenseHeadingId, prefix: headingIdPrefix }, children: _jsx(GenerativeUiContext.Provider, { value: {
                values: generativeUiValues,
                streaming,
                onEvent: (event) => {
                    if (!streaming)
                        onGenerativeUiEvent?.(event);
                },
            }, children: _jsx(BlockCompletionContext.Provider, { value: {
                    enabled: generativeUi && streamingMode === 'block',
                    generating: streaming,
                    pendingAncestor: false,
                    onEvent: onGenerativeUiEvent,
                }, children: _jsx(OgpEndpointContext.Provider, { value: ogpEndpoint, children: _jsx("div", { className: className
                            ? `ink-markdown ${className}`
                            : 'ink-markdown', children: _jsx(MemoizedMarkdown, { remarkPlugins: remarkPlugins, components: renderedComponents, children: normalizedSource }) }) }) }) }) }));
}
//# sourceMappingURL=inkstream-markdown.js.map