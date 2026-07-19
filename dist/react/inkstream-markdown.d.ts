import type { Components } from 'react-markdown';
import { type ResolveWikilink } from '../remark-wikilinks.js';
export interface InkstreamMarkdownProps {
    /** Raw markdown source (Zenn + Mintlify + GFM syntax). */
    children: string;
    /** Extra class names for the `.ink-markdown` wrapper element. */
    className?: string;
    /**
     * Per-tag renderer overrides, merged over the defaults. Accepts the
     * same shape as react-markdown's `components` prop, including the
     * custom inkstream tags (aside, card, tree, quiz, chart, ...).
     */
    components?: Components;
    /**
     * Prefix for heading ids, for pages that render several documents and
     * need their anchors disambiguated. Pass the same value to
     * extractMarkdownHeadings so a table of contents stays in sync.
     */
    headingIdPrefix?: string;
    /**
     * Endpoint the default link-card renderer fetches OGP metadata from,
     * as `GET {ogpEndpoint}?url=...` returning `{title, description,
     * image}` JSON. When omitted, standalone-URL cards render a URL-only
     * fallback instead of rich metadata.
     */
    ogpEndpoint?: string;
    /**
     * Resolves `[[full_path]]` / `[[full_path|label]]` wikilink syntax to a
     * URL. Omit to leave `[[...]]` as literal text — resolution needs
     * app-specific routing/lookup knowledge (e.g. matching a document by
     * title), so there is no default.
     */
    resolveWikilink?: ResolveWikilink;
}
/**
 * Drop-in renderer for inkstream-flavoured markdown: runs the string-level
 * normalizers and the full remark plugin chain, and renders every custom
 * element with unstyled defaults that carry stable `ink-*` class names.
 */
export declare function InkstreamMarkdown({ children, className, components, headingIdPrefix, ogpEndpoint, resolveWikilink, }: InkstreamMarkdownProps): import("react").JSX.Element;
//# sourceMappingURL=inkstream-markdown.d.ts.map