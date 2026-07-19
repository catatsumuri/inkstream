export interface OpenTagMatch {
    name: string;
    attributes: Record<string, string>;
    selfClosing: boolean;
}
/** Matches a string that is exactly one Mintlify open tag. */
export declare function matchOpenTag(value: string): OpenTagMatch | null;
/** Matches a string that is exactly one Mintlify close tag. */
export declare function matchCloseTag(value: string): {
    name: string;
} | null;
/**
 * Returns true if the trimmed line consists solely of one Mintlify block
 * tag. Inline tags (Badge, Tooltip) are excluded on purpose: they're meant
 * to sit mid-sentence, so `normalizeMintlifyBlocks` must not isolate them
 * onto their own blank-line-delimited block.
 */
export declare function isTagLine(line: string): boolean;
//# sourceMappingURL=match-tags.d.ts.map