import { decodeCharacterReferences } from './decode-character-references.js';

const ATTRIBUTE_RE =
    /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * Reads the attributes of an HTML open tag. Values are decoded once
 * (as a browser would). JSX brace expressions are never evaluated: a value
 * that is not a plain quoted/unquoted string is ignored.
 */
export function readHtmlAttributes(attrs: string): Record<string, string> {
    const found: Record<string, string> = {};

    for (const match of attrs.matchAll(ATTRIBUTE_RE)) {
        const value = match[2] ?? match[3] ?? match[4];

        if (value === undefined || value.startsWith('{')) {
            continue;
        }

        found[match[1].toLowerCase()] = decodeCharacterReferences(value);
    }

    return found;
}
