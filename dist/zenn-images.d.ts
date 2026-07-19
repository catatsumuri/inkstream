export interface ImageMetadata {
    src: string;
    width?: number;
    height?: number;
    caption?: string;
}
/**
 * Rewrites Zenn's image sizing / caption authoring syntax into query
 * parameters an image renderer can read back with `parseImageMetadata`:
 * `![](url =250x)` carries the width, and a `*caption*` line directly under
 * an image line is folded into the URL as a caption parameter. The sizing
 * suffix lives inside the markdown image destination, where remark's own
 * parser refuses spaces, so this stays a line-based step. Ported from
 * inkstream v1's `preprocessMarkdownContent`.
 */
export declare function normalizeZennImages(markdown: string): string;
/**
 * Reads back the metadata `normalizeZennImages` encoded into an image URL,
 * returning the clean src plus width/height/caption. Ported from inkstream
 * v1's `parseMarkdownImageMetadata`.
 */
export declare function parseImageMetadata(url?: string | null): ImageMetadata;
//# sourceMappingURL=zenn-images.d.ts.map