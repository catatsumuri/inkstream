import type { Root } from 'mdast';
/**
 * Remark plugin: turns ordinary HTML links (`<a href="...">label</a>`)
 * into Markdown `link` nodes. Because the result is a real `link`, it goes
 * through the same URL sanitizing and the consuming app's custom `a`
 * renderer as `[label](url)`. Raw HTML is never enabled: only `href`,
 * `title` and `target="_blank"` are read, `javascript:`-style schemes are
 * rejected, and anything unusual is left as literal text.
 */
export declare function remarkHtmlLinks(): (tree: Root) => void;
//# sourceMappingURL=remark-html-links.d.ts.map