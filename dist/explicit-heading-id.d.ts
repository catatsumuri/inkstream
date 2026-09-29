export interface ExplicitHeadingId {
    text: string;
    id: string;
}
/**
 * Removes a trailing Pandoc-style `{#id}` marker from heading text.
 * Identifiers intentionally use a conservative portable character set so
 * malformed or ambiguous markers remain visible as ordinary heading text.
 */
export declare function extractExplicitHeadingId(value: string): ExplicitHeadingId | null;
//# sourceMappingURL=explicit-heading-id.d.ts.map