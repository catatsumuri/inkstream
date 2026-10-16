/**
 * Hide math while line-based authoring normalizers rewrite HTML/directives.
 * Each token preserves structural indentation and line count. Parse inline
 * spans with remark-math itself, rather than maintaining a second dollar
 * delimiter grammar. HTML bodies are parsed before tag normalization.
 */
export declare function protectMath(source: string): {
    source: string;
    restore: (value: string) => string;
};
//# sourceMappingURL=protect-math.d.ts.map