import type { Root } from 'mdast';
/**
 * Remark plugin: turns ordinary HTML images (`<img src alt width height>`)
 * into Markdown `image` nodes, so they take the same path as `![alt](url)`
 * (URL sanitizing, the app's custom `img` renderer). Raw HTML is never
 * enabled: only `src` (http/https/relative), `alt`, `title` and integer
 * `width`/`height` are read, and anything unusual stays literal text.
 */
export declare function remarkHtmlImages(): (tree: Root) => void;
//# sourceMappingURL=remark-html-images.d.ts.map