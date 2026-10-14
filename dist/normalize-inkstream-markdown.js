import { normalizeHtmlHeadings } from './normalize-html-headings.js';
import { normalizeMintlifyBlocks } from './normalize-mintlify-blocks.js';
import { normalizeZennDirectiveShorthand } from './normalize-zenn-directive-shorthand.js';
import { normalizeZennImages } from './zenn-images.js';
import { GENERATIVE_UI_BLOCK_TAG_NAMES, GENERATIVE_UI_INLINE_TAG_NAMES, } from './manifest.js';
/**
 * Runs the full string-level preprocessing chain in the order the remark
 * pipeline expects: HTML headings become Markdown headings, then Mintlify
 * block normalization (so tag bodies are
 * dedented before shorthand scanning), then Zenn directive shorthand, then
 * Zenn image size/caption encoding. Consumers should call this instead of
 * composing the individual normalizers themselves.
 */
export function normalizeInkstreamMarkdown(markdown, options = {}) {
    return normalizeZennImages(normalizeZennDirectiveShorthand(normalizeMintlifyBlocks(normalizeHtmlHeadings(markdown), options.generativeUi
        ? {
            additionalBlockTagNames: GENERATIVE_UI_BLOCK_TAG_NAMES,
            additionalInlineTagNames: GENERATIVE_UI_INLINE_TAG_NAMES,
        }
        : undefined)));
}
/** Normalizes Markdown using the static, opt-in Generative UI tag set. */
export function normalizeGenerativeUiMarkdown(markdown) {
    return normalizeInkstreamMarkdown(markdown, { generativeUi: true });
}
//# sourceMappingURL=normalize-inkstream-markdown.js.map