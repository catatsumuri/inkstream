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
export declare function isSafeUrl(url: string, allowedSchemes: readonly string[]): boolean;
//# sourceMappingURL=safe-url.d.ts.map