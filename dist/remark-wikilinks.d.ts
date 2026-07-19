import type { Root } from 'mdast';
/**
 * A resolver's return value: either a plain URL string (always treated as
 * resolved, matching inkstream v1's simple contract) or an object flagging
 * whether the path matched anything, so the renderer can style unresolved
 * links (e.g. a "red link") differently from resolved ones.
 */
export type WikilinkResolution = string | {
    url: string;
    exists?: boolean;
};
/**
 * Resolves a wikilink's `full_path` (the text between `[[` and `]]`, before
 * any `|label`) to a URL. Path-to-URL resolution needs app-specific
 * knowledge this package doesn't have (routing, a document lookup, ...),
 * so it's supplied by the caller.
 */
export type ResolveWikilink = (path: string) => WikilinkResolution;
/**
 * Converts `[[full_path]]` / `[[full_path|label]]` wikilink syntax into
 * link nodes. Label defaults to the path's last `/`-separated segment.
 * Ported from inkstream v1's `remark-wikilinks`; unlike v1's plain
 * `(path: string) => string` contract, the resolver here may also return
 * `{ url, exists: false }` for an unmatched path, which tags the emitted
 * link with the `ink-wikilink-broken` class hook.
 */
export declare function remarkWikilinks(resolveWikilink: ResolveWikilink): (tree: Root) => void;
//# sourceMappingURL=remark-wikilinks.d.ts.map