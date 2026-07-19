/**
 * OGP endpoint the link cards fetch metadata from, provided by
 * InkstreamMarkdown's `ogpEndpoint` prop. Cards render a URL-only
 * fallback when no endpoint is configured.
 */
export declare const OgpEndpointContext: import("react").Context<string | undefined>;
export interface EmbedProps {
    url?: string;
}
/**
 * Renders a standalone URL as a rich link card. OGP metadata is fetched
 * from the endpoint provided via OgpEndpointContext (`GET
 * {endpoint}?url=...` returning `{title, description, image}` JSON); with
 * no endpoint, or while loading / on error, a URL-only card is shown.
 */
export declare function LinkCard({ url }: EmbedProps): import("react").JSX.Element | null;
/** Renders a standalone YouTube URL as an embedded video player. */
export declare function YoutubeEmbed({ url }: EmbedProps): import("react").JSX.Element | null;
/**
 * Renders a standalone GitHub blob URL as an embedded, Shiki-highlighted
 * file excerpt fetched from raw.githubusercontent.com. `#L{start}-L{end}`
 * ranges select the shown lines.
 */
export declare function GithubEmbed({ url }: EmbedProps): import("react").JSX.Element | null;
//# sourceMappingURL=embed-components.d.ts.map