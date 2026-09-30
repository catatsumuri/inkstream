// Only `id` / `name` is read; any other attribute means it is not a bare
// anchor target and the tag is left alone.
const OPEN_ANCHOR = String.raw `<a\s+(?:id|name)=(?:"([^"]*)"|'([^']*)')\s*`;
const SELF_CLOSING_RE = new RegExp(`^${OPEN_ANCHOR}/>$`);
const OPEN_RE = new RegExp(`^${OPEN_ANCHOR}>$`);
const CLOSE_RE = /^<\/a>$/;
// Whitespace, quotes, angle brackets, `&` and `=` would need escaping or
// change how the id is read; reject them instead of guessing.
const SAFE_ID_RE = /^[^\s"'<>&`=]{1,200}$/;
function toAnchor(id) {
    if (id === undefined || !SAFE_ID_RE.test(id)) {
        return null;
    }
    return {
        type: 'htmlAnchor',
        children: [],
        data: { hName: 'span', hProperties: { id } },
    };
}
function idOf(match) {
    return match ? (match[1] ?? match[2]) : undefined;
}
const ANY_ANCHOR_RE = new RegExp(`${OPEN_ANCHOR}(?:/>|>\\s*</a>)`, 'g');
/**
 * A whole flow-level `html` node made only of empty anchors. Consecutive
 * anchor lines without a blank line between them share one `html` node, so
 * the value may hold several.
 */
function anchorsFromFlowHtml(value) {
    const trimmed = value.trim();
    const anchors = [];
    let consumed = 0;
    for (const match of trimmed.matchAll(ANY_ANCHOR_RE)) {
        // Anything between two anchors must be whitespace.
        if (trimmed.slice(consumed, match.index).trim() !== '') {
            return null;
        }
        const anchor = toAnchor(match[1] ?? match[2]);
        if (!anchor) {
            return null;
        }
        anchors.push(anchor);
        consumed = match.index + match[0].length;
    }
    return anchors.length > 0 && consumed === trimmed.length ? anchors : null;
}
/**
 * Replaces empty-anchor `html` nodes in a run of phrasing content:
 * a self-closing `<a id="x" />`, or an `<a id="x">` immediately followed by
 * its `</a>`.
 */
function convertPhrasing(children) {
    const result = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === 'html') {
            const value = child.value.trim();
            const selfClosing = toAnchor(idOf(SELF_CLOSING_RE.exec(value)));
            if (selfClosing) {
                result.push(selfClosing);
                continue;
            }
            const next = children[i + 1];
            const paired = next?.type === 'html' && CLOSE_RE.test(next.value.trim())
                ? toAnchor(idOf(OPEN_RE.exec(value)))
                : null;
            if (paired) {
                result.push(paired);
                i++;
                continue;
            }
        }
        result.push(child);
    }
    return result;
}
function isBlankText(node) {
    return node.type === 'text' && node.value.trim() === '';
}
function transform(parent) {
    const next = [];
    for (const child of parent.children) {
        if (child.type === 'html') {
            const anchors = anchorsFromFlowHtml(child.value);
            next.push(...(anchors ?? [child]));
            continue;
        }
        if (child.type === 'paragraph') {
            const paragraph = child;
            paragraph.children = convertPhrasing(paragraph.children);
            // A paragraph holding nothing but anchors is just a target:
            // hoist them so no empty `<p>` (with its margins) is emitted.
            const meaningful = paragraph.children.filter((node) => !isBlankText(node));
            if (meaningful.length > 0 &&
                meaningful.every((node) => node.type === 'htmlAnchor')) {
                next.push(...meaningful);
                continue;
            }
            next.push(paragraph);
            continue;
        }
        if ('children' in child) {
            transform(child);
        }
        next.push(child);
    }
    parent.children = next;
}
/**
 * Remark plugin: turns empty HTML anchors (`<a id="x" />`, `<a id="x"></a>`,
 * `<a name="x">` forms) into `<span id="x">` fragment targets. Only a bare
 * `id`/`name` with a safe value is accepted; anything else, including
 * anchors with `href` or event-handler attributes, stays as it was. Code
 * fences and inline code are never `html` nodes, so they are untouched.
 */
export function remarkHtmlAnchors() {
    return (tree) => {
        transform(tree);
    };
}
//# sourceMappingURL=remark-html-anchors.js.map