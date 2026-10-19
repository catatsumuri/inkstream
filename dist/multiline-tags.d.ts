/** Strip exactly the enclosing quote markers, leaving authoring indentation. */
export declare function quotePrefix(line: string, limit?: number): {
    prefix: string;
    body: string;
    depth: number;
};
/** Read complete multiline open tags; unsupported/incomplete input is untouched. */
export declare function createMultilineTagReader(source: string, lines: string[], names: readonly string[]): (start: number) => {
    line: string;
    end: number;
} | null;
//# sourceMappingURL=multiline-tags.d.ts.map