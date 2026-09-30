import { trackFenceLine } from './transform-outside-code.js';
// Same character set as `{#id}` explicit ids, so an HTML id and a Markdown
// id behave identically (including duplicate numbering).
const SAFE_ID_RE = /^[\p{L}\p{N}][\p{L}\p{N}._:-]*$/u;
const OPEN_RE = /^( {0,3})<h([1-6])((?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?)>(.*)$/;
const ID_ATTR_RE = /(?:^|\s)id=(?:"([^"]*)"|'([^']*)')/;
/** How many lines a heading may span before it is treated as not a heading. */
const MAX_HEADING_LINES = 12;
function headingLine(indent, level, rawText, attrs) {
    // Inline content is Markdown; line breaks inside the tag collapse to
    // single spaces, as they do in rendered HTML.
    let text = rawText.replace(/\s+/g, ' ').trim();
    if (text === '') {
        return null;
    }
    // A trailing run of `#` would be read as an ATX closing sequence.
    text = text.replace(/(^|\s)(#+)$/, '$1\\$2');
    const idMatch = ID_ATTR_RE.exec(attrs);
    const id = idMatch ? (idMatch[1] ?? idMatch[2]) : undefined;
    const suffix = id !== undefined && SAFE_ID_RE.test(id) ? ` {#${id}}` : '';
    return `${indent}${'#'.repeat(level)} ${text}${suffix}`;
}
/**
 * Rewrites standard HTML headings (`<h1>`–`<h6>`, single or multi-line,
 * with an optional `id`) into the Markdown form the rest of the pipeline
 * already understands: `## Title {#id}`. Doing it on the string means the
 * renderer, the heading extraction API, and the CLI all see the same
 * heading with the same id and the same duplicate numbering.
 *
 * This is not an HTML parser and never emits HTML: only the heading level,
 * the text (read as inline Markdown) and a safe `id` survive. `class`,
 * `style`, event handlers, and every other attribute are dropped. A tag
 * that does not form one clean heading (content after the closing tag,
 * a blank line inside, no closing tag, empty text) is left untouched. Code
 * fences are skipped, and line count is preserved so diagnostics keep
 * pointing at the right source lines.
 */
export function normalizeHtmlHeadings(markdown) {
    const lines = markdown.split('\n');
    const out = [];
    const fenceState = { marker: null };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (trackFenceLine(fenceState, line) || fenceState.marker !== null) {
            out.push(line);
            continue;
        }
        const open = OPEN_RE.exec(line);
        if (open === null) {
            out.push(line);
            continue;
        }
        const [, indent, level, attrs, firstRest] = open;
        const closeTag = `</h${level}>`;
        const parts = [];
        let rest = firstRest;
        let end = i;
        let converted = null;
        for (;;) {
            const closeAt = rest.indexOf(closeTag);
            if (closeAt !== -1) {
                if (rest.slice(closeAt + closeTag.length).trim() === '') {
                    parts.push(rest.slice(0, closeAt));
                    converted = headingLine(indent, Number(level), parts.join(' '), attrs ?? '');
                }
                break;
            }
            parts.push(rest);
            end++;
            if (end >= lines.length ||
                end - i >= MAX_HEADING_LINES ||
                lines[end].trim() === '') {
                break;
            }
            rest = lines[end];
        }
        if (converted === null) {
            out.push(line);
            continue;
        }
        out.push(converted);
        for (let blank = i + 1; blank <= end; blank++) {
            out.push('');
        }
        i = end;
    }
    return out.join('\n');
}
//# sourceMappingURL=normalize-html-headings.js.map