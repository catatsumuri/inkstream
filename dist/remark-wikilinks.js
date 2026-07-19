import { parseWikilinkMatch, WIKILINK_RE } from './wikilink-label.js';
function isParent(node) {
    return Array.isArray(node.children);
}
/**
 * Splits a text node's value on `[[path]]` / `[[path|label]]` matches,
 * returning the replacement node list, or null when the text has no
 * wikilinks.
 */
function splitWikilinksInText(node, resolveWikilink) {
    const parts = [];
    let lastIndex = 0;
    let match;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(node.value)) !== null) {
        const [full, rawPath, rawLabel] = match;
        const { path, label } = parseWikilinkMatch(rawPath, rawLabel);
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                value: node.value.slice(lastIndex, match.index),
            });
        }
        const resolution = resolveWikilink(path);
        const url = typeof resolution === 'string' ? resolution : resolution.url;
        const exists = typeof resolution === 'string' ? true : (resolution.exists ?? true);
        const link = {
            type: 'link',
            url,
            children: [{ type: 'text', value: label }],
        };
        if (!exists) {
            link.data = { hProperties: { className: ['ink-wikilink-broken'] } };
        }
        parts.push(link);
        lastIndex = match.index + full.length;
    }
    if (parts.length === 0) {
        return null;
    }
    if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
    }
    return parts;
}
/**
 * Walks the tree depth-first, splitting every text node's wikilinks in
 * place. Iterates children back-to-front so splicing a match's
 * replacement nodes into a parent doesn't disturb indices still queued
 * for processing.
 */
function visitTextNodes(node, resolveWikilink) {
    if (!isParent(node)) {
        return;
    }
    const children = node.children;
    for (let index = children.length - 1; index >= 0; index -= 1) {
        const child = children[index];
        if (child.type === 'text') {
            const parts = splitWikilinksInText(child, resolveWikilink);
            if (parts) {
                children.splice(index, 1, ...parts);
            }
            continue;
        }
        visitTextNodes(child, resolveWikilink);
    }
}
/**
 * Converts `[[full_path]]` / `[[full_path|label]]` wikilink syntax into
 * link nodes. Label defaults to the path's last `/`-separated segment.
 * Ported from inkstream v1's `remark-wikilinks`; unlike v1's plain
 * `(path: string) => string` contract, the resolver here may also return
 * `{ url, exists: false }` for an unmatched path, which tags the emitted
 * link with the `ink-wikilink-broken` class hook.
 */
export function remarkWikilinks(resolveWikilink) {
    return (tree) => {
        visitTextNodes(tree, resolveWikilink);
    };
}
//# sourceMappingURL=remark-wikilinks.js.map