import { normalizeMarkdownHeadingText } from './markdown-heading-text.js';
import { slugify } from './slugify.js';
import { trackFenceLine, type FenceState } from './transform-outside-code.js';

export type MarkdownHeading = {
    level: number;
    text: string;
    id: string;
};

/**
 * Extracts `#` through `####` headings from raw markdown, skipping fenced
 * code blocks, and assigns each the same id the heading renderers produce
 * (slugified text, optionally prefixed, with `-2`/`-3` suffixes for
 * duplicates). Feed the result to a table-of-contents component to get
 * links that match the rendered document's anchors.
 */
export function extractMarkdownHeadings(
    content: string,
    prefix?: string,
): MarkdownHeading[] {
    const headings: MarkdownHeading[] = [];
    const idCounts = new Map<string, number>();
    const fenceState: FenceState = { marker: null };

    for (const line of content.split('\n')) {
        if (trackFenceLine(fenceState, line) || fenceState.marker !== null) {
            continue;
        }

        const trimmedLine = line.trimStart();
        const match = /^(#{1,4})\s+(.+)$/.exec(trimmedLine);

        if (match === null) {
            continue;
        }

        const text = normalizeMarkdownHeadingText(match[2].trim());
        const slug = slugify(text);
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
