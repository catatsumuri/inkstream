import { extractExplicitHeadingId } from './explicit-heading-id.js';
import { normalizeHtmlHeadings } from './normalize-html-headings.js';
import { normalizeMarkdownHeadingText } from './markdown-heading-text.js';
import { slugify } from './slugify.js';
import { trackFenceLine } from './transform-outside-code.js';
/**
 * Extracts `#` through `####` headings (and the equivalent HTML `<h1>`–`<h4>`
 * headings) from raw markdown, skipping fenced code blocks, and assigns each the same id the heading renderers produce
 * (slugified text, optionally prefixed, with `-2`/`-3` suffixes for
 * duplicates). Feed the result to a table-of-contents component to get
 * links that match the rendered document's anchors.
 */
export function extractMarkdownHeadings(content, prefix) {
    const headings = [];
    const idCounts = new Map();
    const fenceState = { marker: null };
    for (const line of normalizeHtmlHeadings(content).split('\n')) {
        if (trackFenceLine(fenceState, line) || fenceState.marker !== null) {
            continue;
        }
        const trimmedLine = line.trimStart();
        const match = /^(#{1,4})\s+(.+)$/.exec(trimmedLine);
        if (match === null) {
            continue;
        }
        const rawText = match[2].trim();
        const explicitHeadingId = extractExplicitHeadingId(rawText);
        const text = normalizeMarkdownHeadingText(explicitHeadingId?.text ?? rawText);
        const slug = explicitHeadingId?.id ?? slugify(text);
        const baseId = prefix ? `${prefix}-${slug}` : slug;
        const count = (idCounts.get(baseId) ?? 0) + 1;
        idCounts.set(baseId, count);
        headings.push({
            level: match[1].length,
            text,
            id: count === 1 ? baseId : `${baseId}-${count}`,
        });
    }
    return headings;
}
//# sourceMappingURL=extract-markdown-headings.js.map