import type { Root, RootContent } from 'mdast';
import type { Parent } from 'unist';
import { extractYoutubeVideoParameters, isGithubUrl } from './url-matcher.js';

/** Resolve only known providers; arbitrary author-supplied iframe URLs are rejected. */
export function resolveZennEmbed(
    type: string,
    value: string,
): string | undefined {
    if (type === 'youtube') {
        const video = extractYoutubeVideoParameters(value);
        const id = video?.videoId ?? value;
        return /^[\w-]+$/.test(id)
            ? `https://www.youtube-nocookie.com/embed/${id}${video?.start ? `?start=${encodeURIComponent(video.start)}` : ''}`
            : undefined;
    }
    if (type === 'slideshare' && /^[\w-]+$/.test(value))
        return `https://www.slideshare.net/slideshow/embed_code/key/${value}`;
    if (type === 'speakerdeck' && /^[\w-]+(?:\?slide=\d+)?$/.test(value))
        return `https://speakerdeck.com/player/${value}`;
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port)
        return;
    const host = url.hostname;
    if (
        type === 'tweet' &&
        /^(?:www\.)?(?:twitter\.com|x\.com)$/.test(host) &&
        /^\/\w+\/status\/\d+\/?$/.test(url.pathname)
    ) {
        const result = new URL('https://platform.twitter.com/embed/Tweet.html');
        result.searchParams.set(
            'id',
            url.pathname.split('/').filter(Boolean).at(-1)!,
        );
        if (url.searchParams.get('conversation') === 'none')
            result.searchParams.set('conversation', 'none');
        return result.href;
    }
    if (
        type === 'codepen' &&
        host === 'codepen.io' &&
        /^\/[^/]+\/(?:pen|embed)\/[^/]+\/?$/.test(url.pathname)
    ) {
        url.pathname = url.pathname.replace('/pen/', '/embed/');
        return url.href;
    }
    if (type === 'jsfiddle' && host === 'jsfiddle.net') {
        if (!url.pathname.includes('/embedded'))
            url.pathname = url.pathname.replace(/\/?$/, '/embedded/');
        return url.href;
    }
    if (
        type === 'codesandbox' &&
        host === 'codesandbox.io' &&
        url.pathname.startsWith('/embed/')
    ) {
        url.searchParams.set('runonclick', '1');
        return url.href;
    }
    if (
        type === 'stackblitz' &&
        host === 'stackblitz.com' &&
        /^\/(?:edit|github)\//.test(url.pathname)
    ) {
        url.searchParams.set('embed', '1');
        url.searchParams.set('ctl', '1');
        return url.href;
    }
    if (
        type === 'blueprintue' &&
        host === 'blueprintue.com' &&
        /^\/render\/[\w-]+\/?$/.test(url.pathname)
    )
        return url.href;
    if (
        type === 'figma' &&
        /^(?:(?:www|embed)\.)?figma\.com$/.test(host) &&
        /^\/(?:file|design|proto|board|slides|deck)\//.test(url.pathname)
    ) {
        url.hostname = 'embed.figma.com';
        url.pathname = url.pathname.replace(/^\/file\//, '/design/');
        url.searchParams.set('embed-host', 'inkstream');
        return url.href;
    }
    if (type === 'docswell' && /^(?:www\.)?docswell\.com$/.test(host)) {
        const slide =
            /^\/slide\/([\w-]+)\/embed\/?$/.exec(url.pathname)?.[1] ??
            /^\/s\/[^/]+\/([A-Za-z0-9]+)(?:-[^/]*)?(?:\/\d+)?\/?$/.exec(
                url.pathname,
            )?.[1];
        if (slide) {
            const page =
                /^#p(\d+)$/.exec(url.hash)?.[1] ??
                /\/(\d+)\/?$/.exec(url.pathname)?.[1];
            return `https://www.docswell.com/slide/${slide}/embed${page ? `#p${page}` : ''}`;
        }
    }
    return;
}

/** Handle explicit Zenn embeds before the generic standalone-link transform. */
export function remarkZennEmbeds() {
    return (tree: Root, file: { value: unknown }): void => {
        function visit(parent: Parent): void {
            for (let i = 0; i < parent.children.length; i++) {
                const node = parent.children[i] as RootContent;
                if (node.type === 'text' && node.value.includes('\n')) {
                    const pieces: RootContent[] = [];
                    for (const [index, value] of node.value
                        .split('\n')
                        .entries()) {
                        if (index) pieces.push({ type: 'break' });
                        pieces.push({ type: 'text', value });
                    }
                    parent.children.splice(i, 1, ...pieces);
                    i += pieces.length - 1;
                    continue;
                }
                if (
                    node.type === 'html' &&
                    /^<!--[\s\S]*-->$/.test(node.value.trim())
                ) {
                    parent.children.splice(i--, 1);
                    continue;
                }
                if (
                    node.type === 'html' &&
                    /^<br\s*\/?\s*>$/i.test(node.value.trim())
                ) {
                    parent.children[i] = { type: 'break' };
                    continue;
                }
                if (node.type === 'paragraph' && node.position) {
                    const raw = String(file.value)
                        .slice(
                            node.position.start.offset,
                            node.position.end.offset,
                        )
                        .trim();
                    const explicit = /^@\[([a-z]+)\]\(([^\n]+)\)$/.exec(raw);
                    const tweet =
                        /^https:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(
                            raw,
                        );
                    const type = explicit?.[1] ?? (tweet ? 'tweet' : undefined);
                    const value = explicit?.[2] ?? raw;
                    if (type === 'card' || type === 'github') {
                        try {
                            const target = new URL(value);
                            if (
                                ['https:', 'http:'].includes(target.protocol) &&
                                !target.username &&
                                !target.password &&
                                (type !== 'github' || isGithubUrl(value))
                            ) {
                                const url =
                                    type === 'github'
                                        ? value.replace(/#L(\d+)$/, '#L$1-L$1')
                                        : value;
                                parent.children[i] = {
                                    type: 'paragraph',
                                    children: [],
                                    data: {
                                        hName:
                                            type === 'card'
                                                ? 'linkcard'
                                                : 'githubembed',
                                        hProperties: { url },
                                    },
                                } as RootContent;
                                continue;
                            }
                        } catch {
                            /* Keep invalid directives as source text. */
                        }
                    }
                    if (
                        type === 'gist' &&
                        /^https:\/\/gist\.github\.com\/[\w-]+\/[a-fA-F0-9]+(?:\?[^\s]*)?$/.test(
                            value,
                        )
                    ) {
                        parent.children[i] = {
                            type: 'paragraph',
                            children: [],
                            data: {
                                hName: 'gistembed',
                                hProperties: { url: value },
                            },
                        } as RootContent;
                        continue;
                    }
                    const src = type && resolveZennEmbed(type, value);
                    if (src) {
                        parent.children[i] = {
                            type: 'paragraph',
                            children: [],
                            data: {
                                hName: 'iframe',
                                hProperties: {
                                    src,
                                    title: `${type} embed`,
                                    loading: 'lazy',
                                    width: '100%',
                                    height: 450,
                                    allowFullScreen: true,
                                    className: ['ink-zenn-embed'],
                                },
                            },
                        } as RootContent;
                        continue;
                    }
                }
                if ('children' in node) visit(node as Parent);
            }
        }
        visit(tree);
    };
}
