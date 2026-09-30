import { decodeNamedCharacterReference } from 'decode-named-character-reference';
const CHARACTER_REFERENCE_RE = /&(?:#[xX]([0-9a-fA-F]+)|#(\d+)|([A-Za-z][A-Za-z0-9]*));/g;
/**
 * Decodes HTML character references (`&#x22;`, `&#34;`, `&quot;`) in a
 * quoted attribute value, in a single pass so `&amp;#x22;` becomes the
 * literal text `&#x22;` rather than being decoded twice. Unknown or invalid
 * references are left as written.
 */
export function decodeCharacterReferences(value) {
    return value.replace(CHARACTER_REFERENCE_RE, (match, hex, decimal, named) => {
        if (named !== undefined) {
            return decodeNamedCharacterReference(named) || match;
        }
        const codePoint = Number.parseInt(hex ?? decimal ?? '', hex !== undefined ? 16 : 10);
        return codePoint > 0 && codePoint <= 0x10ffff
            ? String.fromCodePoint(codePoint)
            : match;
    });
}
//# sourceMappingURL=decode-character-references.js.map