import { ExternalLink, FileCode } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
    extractYoutubeVideoParameters,
    parseGithubUrl,
} from '../url-matcher.js';
import { ShikiTokenSpans, useShikiHighlighter } from './code-block.js';
import { tokenizeLines } from './shiki.js';

/**
 * OGP endpoint the link cards fetch metadata from, provided by
 * InkstreamMarkdown's `ogpEndpoint` prop. Cards render a URL-only
 * fallback when no endpoint is configured.
 */
export const OgpEndpointContext = createContext<string | undefined>(undefined);

export interface EmbedProps {
    url?: string;
}

interface OgpMetadata {
    title?: string;
    description?: string;
    image?: string;
}

const MAX_SECONDS = 48 * 60 * 60;

/** Maximum number of lines a GitHub embed shows when no range is given. */
const MAX_GITHUB_LINES = 200;

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    php: 'php',
    py: 'python',
    css: 'css',
    json: 'json',
    sh: 'bash',
    bash: 'bash',
    html: 'html',
    htm: 'html',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
};

function detectLanguage(path: string): string {
    const ext = path.split('.').at(-1)?.toLowerCase() ?? '';

    return EXTENSION_TO_LANGUAGE[ext] ?? ext;
}

function hostnameOf(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function LinkCardShell({
    url,
    children,
}: EmbedProps & { children: ReactNode }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ink-link-card"
        >
            {children}
        </a>
    );
}

function LinkCardFallback({ url }: { url: string }) {
    return (
        <LinkCardShell url={url}>
            <span className="ink-link-card-body">
                <span className="ink-link-card-title">{url}</span>
                <span className="ink-link-card-domain">{hostnameOf(url)}</span>
            </span>
            <ExternalLink className="ink-link-card-icon" />
        </LinkCardShell>
    );
}

/**
 * Renders a standalone URL as a rich link card. OGP metadata is fetched
 * from the endpoint provided via OgpEndpointContext (`GET
 * {endpoint}?url=...` returning `{title, description, image}` JSON); with
 * no endpoint, or while loading / on error, a URL-only card is shown.
 */
export function LinkCard({ url }: EmbedProps) {
    const endpoint = useContext(OgpEndpointContext);
    const [metadata, setMetadata] = useState<OgpMetadata | null>(null);

    useEffect(() => {
        if (!endpoint || !url) {
            return;
        }

        const controller = new AbortController();

        const fetchMetadata = async () => {
            try {
                const response = await fetch(
                    `${endpoint}?url=${encodeURIComponent(url)}`,
                    { signal: controller.signal },
                );

                if (response.ok) {
                    setMetadata((await response.json()) as OgpMetadata);
                }
            } catch {
                // The URL-only fallback card is already showing.
            }
        };

        void fetchMetadata();

        return () => controller.abort();
    }, [endpoint, url]);

    if (!url) {
        return null;
    }

    if (!metadata?.title) {
        return <LinkCardFallback url={url} />;
    }

    return (
        <LinkCardShell url={url}>
            {metadata.image && (
                <img
                    src={metadata.image}
                    alt=""
                    loading="lazy"
                    className="ink-link-card-image"
                    onError={(event) => {
                        event.currentTarget.style.display = 'none';
                    }}
                />
            )}
            <span className="ink-link-card-body">
                <span className="ink-link-card-title">{metadata.title}</span>
                {metadata.description && (
                    <span className="ink-link-card-description">
                        {metadata.description}
                    </span>
                )}
                <span className="ink-link-card-domain">{hostnameOf(url)}</span>
            </span>
            <ExternalLink className="ink-link-card-icon" />
        </LinkCardShell>
    );
}

/** Renders a standalone YouTube URL as an embedded video player. */
export function YoutubeEmbed({ url }: EmbedProps) {
    if (!url) {
        return null;
    }

    const params = extractYoutubeVideoParameters(url);

    if (!params?.videoId) {
        return <LinkCard url={url} />;
    }

    const start = Math.min(Number(params.start ?? 0), MAX_SECONDS);
    const startQuery = start ? `?start=${start}` : '';

    return (
        <div className="ink-youtube">
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${params.videoId}${startQuery}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="ink-youtube-frame"
                title="YouTube video"
            />
        </div>
    );
}

/**
 * Renders a standalone GitHub blob URL as an embedded, Shiki-highlighted
 * file excerpt fetched from raw.githubusercontent.com. `#L{start}-L{end}`
 * ranges select the shown lines.
 */
export function GithubEmbed({ url }: EmbedProps) {
    const info = useMemo(() => (url ? parseGithubUrl(url) : null), [url]);
    const [lines, setLines] = useState<string[] | null>(null);
    const [failed, setFailed] = useState(false);
    const highlighter = useShikiHighlighter();
    const language = info ? detectLanguage(info.path) : '';

    // Tokenize the fetched lines as one block so multi-line constructs keep
    // their grammar context; the result stays line-aligned with `lines`.
    const tokenLines = useMemo(
        () =>
            highlighter && lines
                ? tokenizeLines(highlighter, lines.join('\n'), language)
                : null,
        [highlighter, lines, language],
    );

    useEffect(() => {
        setLines(null);
        setFailed(false);

        if (!info) {
            return;
        }

        const controller = new AbortController();
        const rawUrl = `https://raw.githubusercontent.com/${info.owner}/${info.repo}/${info.branch}/${info.path}`;

        const fetchContent = async () => {
            try {
                const response = await fetch(rawUrl, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    setFailed(true);

                    return;
                }

                const allLines = (await response.text()).split('\n');
                const start = info.lineStart ?? 1;

                if (info.lineEnd !== undefined) {
                    setLines(allLines.slice(start - 1, info.lineEnd));
                } else if (info.lineStart !== undefined) {
                    setLines(allLines.slice(start - 1, start));
                } else {
                    setLines(allLines.slice(0, MAX_GITHUB_LINES));
                }
            } catch {
                setFailed(true);
            }
        };

        void fetchContent();

        return () => controller.abort();
    }, [info]);

    if (!url) {
        return null;
    }

    if (!info) {
        return <LinkCardFallback url={url} />;
    }

    const filename = info.path.split('/').at(-1) ?? info.path;
    const lineStart = info.lineStart ?? 1;
    const lineLabel =
        info.lineStart !== undefined
            ? info.lineEnd !== undefined
                ? `L${info.lineStart}–L${info.lineEnd}`
                : `L${info.lineStart}`
            : null;

    return (
        <div className="ink-github-embed">
            <div className="ink-github-embed-header">
                <span className="ink-github-embed-file">
                    <FileCode className="ink-github-embed-file-icon" />
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ink-github-embed-filename"
                        title={`${info.owner}/${info.repo}/${info.path}`}
                    >
                        {filename}
                    </a>
                    {lineLabel && (
                        <span className="ink-github-embed-lines">
                            {lineLabel}
                        </span>
                    )}
                </span>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ink-github-embed-repo"
                >
                    <ExternalLink className="ink-github-embed-repo-icon" />
                    {info.owner}/{info.repo}
                </a>
            </div>
            {failed ? (
                <p className="ink-github-embed-error">
                    Failed to load file content.
                </p>
            ) : (
                <div className="ink-github-embed-scroll">
                    <pre className="ink-github-embed-pre">
                        <code>
                            {(lines ?? []).map((line, index) => (
                                <span
                                    key={index}
                                    className="ink-github-embed-row"
                                >
                                    <span
                                        className="ink-github-embed-lineno"
                                        aria-hidden="true"
                                    >
                                        {lineStart + index}
                                    </span>
                                    <span className="ink-code-tokens">
                                        {tokenLines?.[index] ? (
                                            <ShikiTokenSpans
                                                tokens={tokenLines[index]}
                                            />
                                        ) : (
                                            line
                                        )}
                                    </span>
                                </span>
                            ))}
                        </code>
                    </pre>
                </div>
            )}
        </div>
    );
}
