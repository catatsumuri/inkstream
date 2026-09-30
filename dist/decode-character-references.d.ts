/**
 * Decodes HTML character references (`&#x22;`, `&#34;`, `&quot;`) in a
 * quoted attribute value, in a single pass so `&amp;#x22;` becomes the
 * literal text `&#x22;` rather than being decoded twice. Unknown or invalid
 * references are left as written.
 */
export declare function decodeCharacterReferences(value: string): string;
//# sourceMappingURL=decode-character-references.d.ts.map