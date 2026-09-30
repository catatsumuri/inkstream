/**
 * Reads the attributes of an HTML open tag. Values are decoded once
 * (as a browser would). JSX brace expressions are never evaluated: a value
 * that is not a plain quoted/unquoted string is ignored.
 */
export declare function readHtmlAttributes(attrs: string): Record<string, string>;
//# sourceMappingURL=parse-html-attributes.d.ts.map