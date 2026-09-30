import { normalizeHtmlHeadings } from './normalize-html-headings.js';
import { normalizeMintlifyBlocks } from './normalize-mintlify-blocks.js';
import { normalizeZennDirectiveShorthand } from './normalize-zenn-directive-shorthand.js';
import { normalizeZennImages } from './zenn-images.js';
/**
 * Runs the full string-level preprocessing chain in the order the remark
 * pipeline expects: HTML headings become Markdown headings, then Mintlify
 * block normalization (so tag bodies are
 * dedented before shorthand scanning), then Zenn directive shorthand, then
 * Zenn image size/caption encoding. Consumers should call this instead of
 * composing the individual normalizers themselves.
 */
export function normalizeInkstreamMarkdown(markdown) {
    return normalizeZennImages(normalizeZennDirectiveShorthand(normalizeMintlifyBlocks(normalizeHtmlHeadings(markdown))));
}
//# sourceMappingURL=normalize-inkstream-markdown.js.map