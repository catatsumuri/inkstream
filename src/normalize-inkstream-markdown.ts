import { protectMath } from './protect-math.js';
import { normalizeHtmlHeadings } from './normalize-html-headings.js';
import { normalizeMintlifyBlocks } from './normalize-mintlify-blocks.js';
import { normalizeZennDirectiveShorthand } from './normalize-zenn-directive-shorthand.js';
import { normalizeZennImages } from './zenn-images.js';
import {
    GENERATIVE_UI_BLOCK_TAG_NAMES,
    GENERATIVE_UI_INLINE_TAG_NAMES,
} from './manifest.js';

export interface NormalizeInkstreamMarkdownOptions {
    generativeUi?: boolean;
}

/**
 * Runs the full string-level preprocessing chain in the order the remark
 * pipeline expects, protecting math throughout: HTML headings become Markdown headings, then Mintlify
 * block normalization (so tag bodies are
 * dedented before shorthand scanning), then Zenn directive shorthand, then
 * Zenn image size/caption encoding. Consumers should call this instead of
 * composing the individual normalizers themselves.
 */
export function normalizeInkstreamMarkdown(
    markdown: string,
    options: NormalizeInkstreamMarkdownOptions = {},
): string {
    const math = protectMath(markdown);
    const headings = normalizeHtmlHeadings(math.source);
    const blocks = normalizeMintlifyBlocks(headings, options.generativeUi
        ? {
              additionalBlockTagNames: GENERATIVE_UI_BLOCK_TAG_NAMES,
              additionalInlineTagNames: GENERATIVE_UI_INLINE_TAG_NAMES,
          }
        : undefined);
    return math.restore(normalizeZennImages(normalizeZennDirectiveShorthand(blocks)));
}

/** Normalizes Markdown using the static, opt-in Generative UI tag set. */
export function normalizeGenerativeUiMarkdown(markdown: string): string {
    return normalizeInkstreamMarkdown(markdown, { generativeUi: true });
}
