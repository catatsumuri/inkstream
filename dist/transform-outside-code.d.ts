export interface FenceState {
    marker: string | null;
}
/**
 * Feeds one line into the fence-tracking state and reports whether the line
 * itself is a fence marker line. A fence closes only on a marker of the same
 * character, at least as long, with nothing after it — matching CommonMark
 * (and inkstream v1), where ```js inside an open ``` fence is content, not a
 * closing fence.
 */
export declare function trackFenceLine(state: FenceState, line: string): boolean;
/**
 * Applies `transform` to the parts of a line outside inline code spans,
 * leaving the spans themselves untouched. Ported from inkstream v1's
 * `transformOutsideInlineCode`.
 */
export declare function transformOutsideInlineCode(line: string, transform: (segment: string) => string): string;
/**
 * Applies `transform` to every line that is outside code fences and, within
 * those lines, outside inline code spans. Ported from inkstream v1's
 * `transformOutsideFences`.
 */
export declare function transformOutsideCode(markdown: string, transform: (segment: string) => string): string;
//# sourceMappingURL=transform-outside-code.d.ts.map