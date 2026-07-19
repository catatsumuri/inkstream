// MermaidDiagram is deliberately not re-exported here: a static re-export
// would pull the (huge) mermaid bundle into the main chunk and defeat the
// lazy import in code-block.tsx. Import it from
// '@catatsumuri/inkstream/react/mermaid' if you need it directly.
export { CodeBlock } from './code-block.js';
export { GithubEmbed, LinkCard, OgpEndpointContext, YoutubeEmbed, } from './embed-components.js';
export { inkstreamDefaultComponents, } from './default-components.js';
export { extractRenderedHeadingText, headingComponents, } from './heading-components.js';
export { InkstreamMarkdown, } from './inkstream-markdown.js';
export { normalizeInkstreamMarkdown } from '../normalize-inkstream-markdown.js';
export { inkstreamRemarkPlugins } from '../remark-plugins.js';
//# sourceMappingURL=index.js.map