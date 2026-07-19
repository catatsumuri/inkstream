import type { Highlighter, ThemedToken } from 'shiki';
/**
 * Both themes are emitted per token as CSS variables (--shiki-light /
 * --shiki-dark) because defaultColor is disabled; the consumer's stylesheet
 * switches between them (typically via a `.dark` class on the root element).
 */
export declare const SHIKI_THEMES: {
    readonly light: "github-light";
    readonly dark: "github-dark";
};
/**
 * Lazily creates the app-wide highlighter singleton. Shiki is an optional
 * peer dependency loaded via dynamic import, so it stays out of the main
 * bundle, never runs during SSR module evaluation, and resolves to null
 * when shiki is not installed (callers render plain text instead).
 */
export declare function getHighlighter(): Promise<Highlighter | null>;
/**
 * Tokenizes code into per-line themed tokens, or null when the language is
 * not part of the loaded grammar set (callers render plain text instead).
 * Aliases registered by the grammars (js, ts, py, sh, yml, ...) resolve too.
 */
export declare function tokenizeLines(highlighter: Highlighter, code: string, language: string): ThemedToken[][] | null;
//# sourceMappingURL=shiki.d.ts.map