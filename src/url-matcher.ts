/**
 * URL matching utilities for the linkify-to-card embeds.
 * Ported from inkstream v1's `url-matcher` (itself derived from
 * zenn-editor's url-matcher).
 */

/** Returns true if the URL is a GitHub file blob URL. */
export function isGithubUrl(url: string): boolean {
    return /^https:\/\/github\.com\/([a-zA-Z0-9](-?[a-zA-Z0-9]){0,38})\/([a-zA-Z0-9](-?[a-zA-Z0-9._]){0,99})\/blob\/[^~\s:?[*^/\\]{2,}\/[\w!\-_~.*%()'"/]+(?:#L\d+(?:-L\d+)?)?$/.test(
        url,
    );
}

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
export function parseGithubUrl(url: string): GithubFileInfo | null {
    const match =
        /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(?:#L(\d+)(?:-L(\d+))?)?$/.exec(
            url,
        );

    if (!match) {
        return null;
    }

    return {
        owner: match[1],
        repo: match[2],
        branch: match[3],
        path: match[4],
        lineStart: match[5] ? parseInt(match[5], 10) : undefined,
        lineEnd: match[6] ? parseInt(match[6], 10) : undefined,
    };
}

/** Returns true if the URL is a YouTube video URL. */
export function isYoutubeUrl(url: string): boolean {
    return [
        /^https?:\/\/youtu\.be\/[\w-]+(?:\?[\w=&-]+)?$/,
        /^https?:\/\/(?:www\.)?youtube\.com\/watch\?[\w=&-]+$/,
    ].some((pattern) => pattern.test(url));
}

const YOUTUBE_VIDEO_ID_LENGTH = 11;

/**
 * Normalizes a YouTube `t` parameter to whole seconds. Accepts plain seconds
 * (`90`, `90s`) and duration forms (`1m30s`, `1h2m3s`); returns undefined for
 * anything else.
 */
function parseYoutubeStartTime(t: string | null): string | undefined {
    if (!t) {
        return undefined;
    }

    if (/^\d+s?$/.test(t)) {
        return t.replace('s', '');
    }

    const match =
        /^(?:(?<hours>\d+)h)?(?:(?<minutes>\d+)m)?(?:(?<seconds>\d+)s)?$/.exec(
            t,
        );

    if (!match || match[0] === '') {
        return undefined;
    }

    const { hours, minutes, seconds } = match.groups!;
    const total =
        Number(hours ?? 0) * 3600 +
        Number(minutes ?? 0) * 60 +
        Number(seconds ?? 0);

    return String(total);
}

/**
 * Extracts the video ID and optional start time (in seconds) from a YouTube URL.
 */
export function extractYoutubeVideoParameters(
    youtubeUrl: string,
): { videoId: string; start?: string } | undefined {
    if (!isYoutubeUrl(youtubeUrl)) {
        return undefined;
    }

    const url = new URL(youtubeUrl);
    const params = new URLSearchParams(url.search || '');

    const videoId = params.get('v') || url.pathname.split('/')[1];
    const start = parseYoutubeStartTime(params.get('t'));

    if (videoId?.length !== YOUTUBE_VIDEO_ID_LENGTH) {
        return undefined;
    }

    return { videoId, start };
}
