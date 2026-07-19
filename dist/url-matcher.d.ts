/**
 * URL matching utilities for the linkify-to-card embeds.
 * Ported from inkstream v1's `url-matcher` (itself derived from
 * zenn-editor's url-matcher).
 */
/** Returns true if the URL is a GitHub file blob URL. */
export declare function isGithubUrl(url: string): boolean;
export type GithubFileInfo = {
    owner: string;
    repo: string;
    branch: string;
    path: string;
    lineStart?: number;
    lineEnd?: number;
};
/**
 * Parses a GitHub blob URL into its components.
 * Returns null if the URL does not match the expected format.
 */
export declare function parseGithubUrl(url: string): GithubFileInfo | null;
/** Returns true if the URL is a YouTube video URL. */
export declare function isYoutubeUrl(url: string): boolean;
/**
 * Extracts the video ID and optional start time (in seconds) from a YouTube URL.
 */
export declare function extractYoutubeVideoParameters(youtubeUrl: string): {
    videoId: string;
    start?: string;
} | undefined;
//# sourceMappingURL=url-matcher.d.ts.map