/** Code-fence presentation options. Values are literals; expressions are never evaluated. */
export interface CodeOptions {
    title?: string;
    lineNumbers: boolean;
    highlight: readonly (readonly [number, number])[];
}
/**
 * Read named options without confusing words inside quoted titles with flags.
 * Quoted, unquoted and simple brace values are accepted for numbers/booleans;
 * a title must be a quoted or unquoted string. Malformed values stop scanning.
 */
export declare function parseCodeOptions(meta?: string): CodeOptions;
export declare function isHighlightedLine(options: CodeOptions, line: number): boolean;
//# sourceMappingURL=code-options.d.ts.map