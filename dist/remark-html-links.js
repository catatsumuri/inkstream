import { decodeCharacterReferences } from './decode-character-references.js';
import { readHtmlAttributes } from './parse-html-attributes.js';
import { isSafeUrl } from './safe-url.js';
// The schemes react-markdown's default URL transform lets through; anything
// else would be blanked to an empty href there, which is worse than literal
// text.
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];
// A complete `<a ...>` open tag; quoted attribute values may contain `>`.
const OPEN_A_RE = /^<a((?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?)>$/;
const CLOSE_A_RE = /^<\/a>$/;
const WHOLE_A_RE = /^<a((?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?)>([^<]*)<\/a>$/;
/**
 * Turns the attributes of an `<a>` open tag into link properties, or null
 * when it is not a safe, ordinary link (no `href`, or a scheme other than
 * http/https/mailto). Only `href`, `title` and `target="_blank"` are
 * kept; `class`/`className`, `style`, `id`, event handlers and everything
 * else are dropped.
 */
function linkProps(attrs) {
    const attributes = readHtmlAttributes(attrs);
    const href = attributes.href?.trim();
    if (!href || !isSafeUrl(href, ALLOWED_SCHEMES)) {
        return null;
    }
    return {
        url: href,
        title: attributes.title || null,
        target: attributes.target === '_blank' ? '_blank' : undefined,
    };
}
function makeLink(props, children) {
    const link = {
        type: 'link',
        url: props.url,
        title: props.title,
        children,
    };
    // `target="_blank"` always carries rel=noopener noreferrer, whatever the
    // source said, so the opened page cannot reach `window.opener`.
    if (props.target) {
        link.data = {
            hProperties: { target: '_blank', rel: ['noopener', 'noreferrer'] },
        };
    }
    return link;
}
/**
 * Pairs `<a href>` ... `</a>` html nodes inside a run of phrasing content
 * into `link` nodes. No nesting: if another `<a` opens before the close,
 * or the label is empty, the tags are left as they were.
 */
function convertPhrasing(children) {
    const result = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const open = child.type === 'html' ? OPEN_A_RE.exec(child.value.trim()) : null;
        const props = open ? linkProps(open[1] ?? '') : null;
        if (!props) {
            result.push(child);
            continue;
        }
        let close = -1;
        for (let j = i + 1; j < children.length; j++) {
            const candidate = children[j];
            if (candidate.type !== 'html') {
                continue;
            }
            const value = candidate.value.trim();
            if (CLOSE_A_RE.test(value)) {
                close = j;
                break;
            }
            if (/^<a[\s>]/.test(value)) {
                break;
            }
        }
        const label = close === -1 ? [] : children.slice(i + 1, close);
        if (close === -1 || label.length === 0) {
            result.push(child);
            continue;
        }
        result.push(makeLink(props, label));
        i = close;
    }
    return result;
}
const PHRASING_PARENTS = new Set([
    'paragraph',
    'heading',
    'tableCell',
    'emphasis',
    'strong',
    'delete',
]);
/**
 * A flow-level `html` node that is one whole link with a plain-text label
 * (`<a href="...">` / label / `</a>` on separate lines shares one node).
 */
function paragraphFromFlowHtml(value) {
    const whole = WHOLE_A_RE.exec(value.trim());
    const props = whole ? linkProps(whole[1] ?? '') : null;
    const label = whole ? decodeCharacterReferences(whole[2]).replace(/\s+/g, ' ').trim() : '';
    if (!props || label === '') {
        return null;
    }
    return {
        type: 'paragraph',
        children: [makeLink(props, [{ type: 'text', value: label }])],
    };
}
function transform(parent) {
    if (PHRASING_PARENTS.has(parent.type)) {
        parent.children = convertPhrasing(parent.children);
    }
    parent.children = parent.children.map((child) => {
        if (child.type === 'html') {
            return paragraphFromFlowHtml(child.value) ?? child;
        }
        return child;
    });
    for (const child of parent.children) {
        if ('children' in child) {
            transform(child);
        }
    }
}
/**
 * Remark plugin: turns ordinary HTML links (`<a href="...">label</a>`)
 * into Markdown `link` nodes. Because the result is a real `link`, it goes
 * through the same URL sanitizing and the consuming app's custom `a`
 * renderer as `[label](url)`. Raw HTML is never enabled: only `href`,
 * `title` and `target="_blank"` are read, `javascript:`-style schemes are
 * rejected, and anything unusual is left as literal text.
 */
export function remarkHtmlLinks() {
    return (tree) => {
        transform(tree);
    };
}
//# sourceMappingURL=remark-html-links.js.map