import type { ComponentPropsWithoutRef } from 'react';
import type { ExtraProps } from 'react-markdown';
import type { Highlighter, ThemedToken } from 'shiki';
type CodeBlockProps = ComponentPropsWithoutRef<'code'> & ExtraProps & {
    metastring?: string;
};
/**
 * Resolves the shared Shiki highlighter after mount; returns null until it
 * is ready (or forever, when shiki is not installed) so callers can render
 * plain text as a fallback.
 */
export declare function useShikiHighlighter(): Highlighter | null;
/**
 * Renders one line of Shiki tokens. Theme colors live in the tokens' CSS
 * variables and are resolved by the consumer's `.ink-code-tokens` rules, so
 * the enclosing element must carry the `ink-code-tokens` class.
 */
export declare function ShikiTokenSpans({ tokens }: {
    tokens: ThemedToken[];
}): import("react").JSX.Element;
/**
 * Default renderer for markdown code: inline code stays a plain `<code>`,
 * fenced blocks get Shiki highlighting, a copy button, a line-wrap toggle,
 * an optional filename header (` ```php:index.php `), and a diff mode
 * (` ```diff js:app.js `). Pair it with `pre` unwrapped to a fragment, as
 * the block renders its own `<pre>` inside an `.ink-code-block` container.
 */
export declare function CodeBlock({ className, children, node, metastring, }: CodeBlockProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=code-block.d.ts.map