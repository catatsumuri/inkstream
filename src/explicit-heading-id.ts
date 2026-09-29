export interface ExplicitHeadingId {
    text: string;
    id: string;
}

const EXPLICIT_HEADING_ID_RE =
    /(?:^|\s)\{#([\p{L}\p{N}][\p{L}\p{N}._:-]*)\}\s*$/u;

/**
 * Removes a trailing Pandoc-style `{#id}` marker from heading text.
 * Identifiers intentionally use a conservative portable character set so
 * malformed or ambiguous markers remain visible as ordinary heading text.
 */
export function extractExplicitHeadingId(
    value: string,
): ExplicitHeadingId | null {
    const match = EXPLICIT_HEADING_ID_RE.exec(value);

    if (match === null) {
        return null;
    }

    return { text: value.slice(0, match.index).trimEnd(), id: match[1] };
}
