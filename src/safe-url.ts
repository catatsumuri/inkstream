const SCHEME_RE = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

/**
 * Whether a URL taken from author-supplied markup is safe to emit as a
 * link or image target. Relative URLs (`/x`, `./x`, `../x`, `#frag`,
 * `?q`, `x/y`) are allowed, and absolute ones only for the listed schemes.
 *
 * Browsers ignore tabs, newlines and other control characters inside a URL,
 * so they are removed before the scheme is read; otherwise
 * `java\tscript:` would slip past a naive check. Callers should decode
 * character references first (`javascript&colon;` is the same URL).
 */
export function isSafeUrl(
    url: string,
    allowedSchemes: readonly string[],
): boolean {
    const compact = [...url]
        .filter((char) => {
            const code = char.charCodeAt(0);

            // Drop whitespace and control characters (including C1 and the
            // Unicode line/paragraph separators).
            return (
                code > 0x20 &&
                !(code >= 0x7f && code <= 0x9f) &&
                code !== 0x2028 &&
                code !== 0x2029
            );
        })
        .join('');

    if (compact === '') {
        return false;
    }

    const scheme = SCHEME_RE.exec(compact);

    if (scheme) {
        return allowedSchemes.includes(scheme[1].toLowerCase());
    }

    // A colon before any `/`, `?` or `#` would make it a scheme we could not
    // parse (`1abc:x`), so it is not a plain relative URL.
    const firstDelimiter = compact.search(/[/?#]/);
    const colon = compact.indexOf(':');

    return colon === -1 || (firstDelimiter !== -1 && firstDelimiter < colon);
}
