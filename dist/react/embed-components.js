import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExternalLink, FileCode } from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { extractYoutubeVideoParameters, parseGithubUrl, } from '../url-matcher.js';
import { ShikiTokenSpans, useShikiHighlighter } from './code-block.js';
import { tokenizeLines } from './shiki.js';
/**
 * OGP endpoint the link cards fetch metadata from, provided by
 * InkstreamMarkdown's `ogpEndpoint` prop. Cards render a URL-only
 * fallback when no endpoint is configured.
 */
export const OgpEndpointContext = createContext(undefined);
const MAX_SECONDS = 48 * 60 * 60;
/** Maximum number of lines a GitHub embed shows when no range is given. */
const MAX_GITHUB_LINES = 200;
const EXTENSION_TO_LANGUAGE = {
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
function detectLanguage(path) {
    const ext = path.split('.').at(-1)?.toLowerCase() ?? '';
    return EXTENSION_TO_LANGUAGE[ext] ?? ext;
}
function hostnameOf(url) {
    try {
        return new URL(url).hostname;
    }
    catch {
        return url;
    }
}
function LinkCardShell({ url, children, }) {
    return (_jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "ink-link-card", children: children }));
}
function LinkCardFallback({ url }) {
    return (_jsxs(LinkCardShell, { url: url, children: [_jsxs("span", { className: "ink-link-card-body", children: [_jsx("span", { className: "ink-link-card-title", children: url }), _jsx("span", { className: "ink-link-card-domain", children: hostnameOf(url) })] }), _jsx(ExternalLink, { className: "ink-link-card-icon" })] }));
}
/**
 * Renders a standalone URL as a rich link card. OGP metadata is fetched
 * from the endpoint provided via OgpEndpointContext (`GET
 * {endpoint}?url=...` returning `{title, description, image}` JSON); with
 * no endpoint, or while loading / on error, a URL-only card is shown.
 */
export function LinkCard({ url }) {
    const endpoint = useContext(OgpEndpointContext);
    const [metadata, setMetadata] = useState(null);
    useEffect(() => {
        if (!endpoint || !url) {
            return;
        }
        const controller = new AbortController();
        const fetchMetadata = async () => {
            try {
                const response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, { signal: controller.signal });
                if (response.ok) {
                    setMetadata((await response.json()));
                }
            }
            catch {
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
        return _jsx(LinkCardFallback, { url: url });
    }
    return (_jsxs(LinkCardShell, { url: url, children: [metadata.image && (_jsx("img", { src: metadata.image, alt: "", loading: "lazy", className: "ink-link-card-image", onError: (event) => {
                    event.currentTarget.style.display = 'none';
                } })), _jsxs("span", { className: "ink-link-card-body", children: [_jsx("span", { className: "ink-link-card-title", children: metadata.title }), metadata.description && (_jsx("span", { className: "ink-link-card-description", children: metadata.description })), _jsx("span", { className: "ink-link-card-domain", children: hostnameOf(url) })] }), _jsx(ExternalLink, { className: "ink-link-card-icon" })] }));
}
/** Renders a standalone YouTube URL as an embedded video player. */
export function YoutubeEmbed({ url }) {
    if (!url) {
        return null;
    }
    const params = extractYoutubeVideoParameters(url);
    if (!params?.videoId) {
        return _jsx(LinkCard, { url: url });
    }
    const start = Math.min(Number(params.start ?? 0), MAX_SECONDS);
    const startQuery = start ? `?start=${start}` : '';
    return (_jsx("div", { className: "ink-youtube", children: _jsx("iframe", { src: `https://www.youtube-nocookie.com/embed/${params.videoId}${startQuery}`, allow: "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, loading: "lazy", className: "ink-youtube-frame", title: "YouTube video" }) }));
}
/**
 * Renders a standalone GitHub blob URL as an embedded, Shiki-highlighted
 * file excerpt fetched from raw.githubusercontent.com. `#L{start}-L{end}`
 * ranges select the shown lines.
 */
export function GithubEmbed({ url }) {
    const info = useMemo(() => (url ? parseGithubUrl(url) : null), [url]);
    const [lines, setLines] = useState(null);
    const [failed, setFailed] = useState(false);
    const highlighter = useShikiHighlighter();
    const language = info ? detectLanguage(info.path) : '';
    // Tokenize the fetched lines as one block so multi-line constructs keep
    // their grammar context; the result stays line-aligned with `lines`.
    const tokenLines = useMemo(() => highlighter && lines
        ? tokenizeLines(highlighter, lines.join('\n'), language)
        : null, [highlighter, lines, language]);
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
                }
                else if (info.lineStart !== undefined) {
                    setLines(allLines.slice(start - 1, start));
                }
                else {
                    setLines(allLines.slice(0, MAX_GITHUB_LINES));
                }
            }
            catch {
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
        return _jsx(LinkCardFallback, { url: url });
    }
    const filename = info.path.split('/').at(-1) ?? info.path;
    const lineStart = info.lineStart ?? 1;
    const lineLabel = info.lineStart !== undefined
        ? info.lineEnd !== undefined
            ? `L${info.lineStart}–L${info.lineEnd}`
            : `L${info.lineStart}`
        : null;
    return (_jsxs("div", { className: "ink-github-embed", children: [_jsxs("div", { className: "ink-github-embed-header", children: [_jsxs("span", { className: "ink-github-embed-file", children: [_jsx(FileCode, { className: "ink-github-embed-file-icon" }), _jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "ink-github-embed-filename", title: `${info.owner}/${info.repo}/${info.path}`, children: filename }), lineLabel && (_jsx("span", { className: "ink-github-embed-lines", children: lineLabel }))] }), _jsxs("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "ink-github-embed-repo", children: [_jsx(ExternalLink, { className: "ink-github-embed-repo-icon" }), info.owner, "/", info.repo] })] }), failed ? (_jsx("p", { className: "ink-github-embed-error", children: "Failed to load file content." })) : (_jsx("div", { className: "ink-github-embed-scroll", children: _jsx("pre", { className: "ink-github-embed-pre", children: _jsx("code", { children: (lines ?? []).map((line, index) => (_jsxs("span", { className: "ink-github-embed-row", children: [_jsx("span", { className: "ink-github-embed-lineno", "aria-hidden": "true", children: lineStart + index }), _jsx("span", { className: "ink-code-tokens", children: tokenLines?.[index] ? (_jsx(ShikiTokenSpans, { tokens: tokenLines[index] })) : (line) })] }, index))) }) }) }))] }));
}
//# sourceMappingURL=embed-components.js.map