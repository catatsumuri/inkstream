import type { Root } from 'mdast';
export type EmbedType = 'youtube' | 'card' | 'github';
/**
 * Converts paragraphs that consist of a single standalone http(s) URL into
 * embed elements (`linkcard`, `youtubeembed`, `githubembed`) carrying the
 * URL as an attribute. GFM autolink literals turn bare URL lines into link
 * nodes before this transform runs, so both `https://...` lines and
 * explicit `[text](url)`-only paragraphs are picked up. Ported from
 * inkstream v1's `remark-linkify-to-card`, which emitted `data-embed-*`
 * divs for an app-side dispatcher; v2 emits the custom elements the
 * default component set renders directly.
 */
export declare function remarkLinkifyToCard(): (tree: Root) => void;
//# sourceMappingURL=remark-linkify-to-card.d.ts.map