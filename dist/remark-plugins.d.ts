import type { PluggableList } from 'unified';
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
export declare function createInkstreamRemarkPlugins(options?: InkstreamRemarkPluginOptions): PluggableList;
export declare const inkstreamRemarkPlugins: PluggableList;
export declare const generativeUiRemarkPlugins: PluggableList;
//# sourceMappingURL=remark-plugins.d.ts.map