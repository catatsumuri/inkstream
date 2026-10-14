import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import type { Pluggable, PluggableList } from 'unified';
import { remarkCodeFenceComponents } from './remark-code-fence-components.js';
import { remarkCodeMeta } from './remark-code-meta.js';
import { remarkGithubAlerts } from './remark-github-alerts.js';
import { remarkHtmlAnchors } from './remark-html-anchors.js';
import { remarkHtmlImages } from './remark-html-images.js';
import { remarkHtmlLinks } from './remark-html-links.js';
import { remarkLinkifyToCard } from './remark-linkify-to-card.js';
import { remarkMintlifyTags } from './remark-mintlify-tags.js';
import { remarkRestoreTimeText } from './remark-restore-time-text.js';
import { remarkTreeTags } from './remark-tree-tags.js';
import { remarkZennDirective } from './remark-zenn-directive.js';
import {
    GENERATIVE_UI_BLOCK_TAG_NAMES,
    GENERATIVE_UI_INLINE_TAG_NAMES,
    GENERATIVE_UI_TAG_ATTRIBUTES,
} from './manifest.js';

export interface InkstreamRemarkPluginOptions {
    generativeUi?: boolean;
}

/**
 * The full inkstream remark plugin chain, in the order the transforms
 * depend on: GFM and directive parsing first, then time-text restoration,
 * Zenn directives, linkify-to-card embeds, GitHub alerts, Mintlify tag
 * pairing, empty HTML anchors, HTML links, HTML images, JSX Tree parsing,
 * and finally code-fence components. Pass this to react-markdown or
 * `unified().use()` instead of assembling the plugins by hand.
 */
export function createInkstreamRemarkPlugins(
    options: InkstreamRemarkPluginOptions = {},
): PluggableList {
    const mintlifyTags: Pluggable = options.generativeUi
        ? [
              remarkMintlifyTags,
              {
                  additionalBlockTagNames: GENERATIVE_UI_BLOCK_TAG_NAMES,
                  additionalInlineTagNames: GENERATIVE_UI_INLINE_TAG_NAMES,
                  additionalTagAttributes: GENERATIVE_UI_TAG_ATTRIBUTES,
                  additionalAttributePatterns: {
                      Box: { padding: /^(?:[0-8])$/ },
                      Row: {
                          align: /^(?:start|center|end|stretch|baseline)$/,
                          justify: /^(?:start|center|end|between|around)$/,
                          gap: /^(?:[0-8])$/,
                      },
                      Column: {
                          align: /^(?:start|center|end|stretch|baseline)$/,
                          justify: /^(?:start|center|end|between|around)$/,
                          gap: /^(?:[0-8])$/,
                      },
                      Icon: { name: /^[a-z][a-z0-9-]{0,48}$/ },
                      Button: { action: /^[a-z][a-z0-9._:-]{0,63}$/ },
                      Slider: {
                          id: /^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/,
                          min: /^-?(?:\d+(?:\.\d+)?|\.\d+)$/,
                          max: /^-?(?:\d+(?:\.\d+)?|\.\d+)$/,
                          step: /^(?:\d+(?:\.\d+)?|\.\d+)$/,
                          default: /^-?(?:\d+(?:\.\d+)?|\.\d+)$/,
                      },
                  },
              },
          ]
        : remarkMintlifyTags;

    return [
        [remarkGfm, { singleTilde: false }],
        remarkDirective,
        remarkRestoreTimeText,
        remarkZennDirective,
        remarkLinkifyToCard,
        remarkGithubAlerts,
        mintlifyTags,
        remarkHtmlAnchors,
        remarkHtmlLinks,
        remarkHtmlImages,
        remarkTreeTags,
        remarkCodeFenceComponents,
        remarkCodeMeta,
    ];
}

export const inkstreamRemarkPlugins: PluggableList =
    createInkstreamRemarkPlugins();

export const generativeUiRemarkPlugins: PluggableList =
    createInkstreamRemarkPlugins({ generativeUi: true });
