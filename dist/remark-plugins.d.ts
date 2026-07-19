import type { PluggableList } from 'unified';
/**
 * The full inkstream remark plugin chain, in the order the transforms
 * depend on: GFM and directive parsing first, then Zenn directives,
 * linkify-to-card embeds, GitHub alerts, Mintlify tag pairing, JSX Tree
 * parsing, and finally
 * code-fence components. Pass this to react-markdown or `unified().use()`
 * instead of assembling the plugins by hand.
 */
export declare const inkstreamRemarkPlugins: PluggableList;
//# sourceMappingURL=remark-plugins.d.ts.map