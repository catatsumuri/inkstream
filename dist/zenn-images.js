import { trackFenceLine } from './transform-outside-code.js';
const IMAGE_WIDTH_PARAM = '__markdown_width';
const IMAGE_HEIGHT_PARAM = '__markdown_height';
const IMAGE_CAPTION_PARAM = '__markdown_caption';
function isAbsoluteUrl(url) {
    return (url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('//') ||
        url.startsWith('data:'));
}
/**
 * Splits a non-absolute URL into path, query, and hash without resolving it
 * against a base, so relative paths (`images/foo.png`, `../foo.png`) survive
 * round-tripping unchanged.
 */
function splitNonAbsoluteUrl(url) {
    const hashIndex = url.indexOf('#');
    const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
    const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const queryIndex = beforeHash.indexOf('?');
    return {
        path: queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex),
        params: new URLSearchParams(queryIndex === -1 ? '' : beforeHash.slice(queryIndex + 1)),
        hash,
    };
}
function joinNonAbsoluteUrl({ path, params, hash, }) {
    const query = params.toString();
    return `${path}${query ? `?${query}` : ''}${hash}`;
}
function setMetadataParams(params, metadata) {
    if (metadata.width) {
        params.set(IMAGE_WIDTH_PARAM, metadata.width);
    }
    if (metadata.height) {
        params.set(IMAGE_HEIGHT_PARAM, metadata.height);
    }
    if (metadata.caption) {
        params.set(IMAGE_CAPTION_PARAM, metadata.caption);
    }
}
function buildUrlWithMetadata(url, metadata) {
    if (isAbsoluteUrl(url)) {
        const urlObject = new URL(url, 'https://zenn.local');
        setMetadataParams(urlObject.searchParams, metadata);
        return urlObject.toString();
    }
    const parts = splitNonAbsoluteUrl(url);
    setMetadataParams(parts.params, metadata);
    return joinNonAbsoluteUrl(parts);
}
function encodeImageTarget(target, caption) {
    const match = /^(?<url>\S+?)(?:\s+=(?<width>\d+)x(?<height>\d*))?$/.exec(target);
    if (!match?.groups?.url) {
        return target;
    }
    return buildUrlWithMetadata(match.groups.url, {
        width: match.groups.width,
        height: match.groups.height,
        caption,
    });
}
function rewriteImageLine(line, caption) {
    const plainImageMatch = /^!\[(?<alt>[^\]]*)\]\((?<target>.+)\)$/.exec(line);
    if (plainImageMatch?.groups?.target !== undefined) {
        const encodedTarget = encodeImageTarget(plainImageMatch.groups.target, caption);
        return `![${plainImageMatch.groups.alt}](${encodedTarget})`;
    }
    const linkedImageMatch = /^\[!\[(?<alt>[^\]]*)\]\((?<target>.+)\)\]\((?<href>.+)\)$/.exec(line);
    if (linkedImageMatch?.groups?.target !== undefined) {
        const encodedTarget = encodeImageTarget(linkedImageMatch.groups.target, caption);
        return `[![${linkedImageMatch.groups.alt}](${encodedTarget})](${linkedImageMatch.groups.href})`;
    }
    return null;
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
export function normalizeZennImages(markdown) {
    const lines = markdown.split('\n');
    const processedLines = [];
    const fenceState = { marker: null };
    for (let index = 0; index < lines.length; index++) {
        const currentLine = lines[index];
        if (trackFenceLine(fenceState, currentLine)) {
            processedLines.push(currentLine);
            continue;
        }
        if (fenceState.marker !== null) {
            processedLines.push(currentLine);
            continue;
        }
        const trimmedLine = currentLine.trim();
        const nextLine = lines[index + 1];
        const captionMatch = /^\*(.+)\*$/.exec(nextLine?.trim() ?? '');
        const rewrittenLine = rewriteImageLine(trimmedLine, captionMatch?.[1]?.trim());
        if (rewrittenLine === null) {
            processedLines.push(currentLine);
            continue;
        }
        processedLines.push(currentLine.replace(trimmedLine, rewrittenLine));
        if (captionMatch) {
            index++;
        }
    }
    return processedLines.join('\n');
}
/**
 * Reads back the metadata `normalizeZennImages` encoded into an image URL,
 * returning the clean src plus width/height/caption. Ported from inkstream
 * v1's `parseMarkdownImageMetadata`.
 */
export function parseImageMetadata(url) {
    if (!url) {
        return { src: '' };
    }
    const extractMetadata = (params) => {
        const width = params.get(IMAGE_WIDTH_PARAM);
        const height = params.get(IMAGE_HEIGHT_PARAM);
        const caption = params.get(IMAGE_CAPTION_PARAM);
        params.delete(IMAGE_WIDTH_PARAM);
        params.delete(IMAGE_HEIGHT_PARAM);
        params.delete(IMAGE_CAPTION_PARAM);
        return {
            width: width ? Number(width) : undefined,
            height: height ? Number(height) : undefined,
            caption: caption || undefined,
        };
    };
    if (isAbsoluteUrl(url)) {
        const urlObject = new URL(url, 'https://zenn.local');
        const metadata = extractMetadata(urlObject.searchParams);
        return { src: urlObject.toString(), ...metadata };
    }
    const parts = splitNonAbsoluteUrl(url);
    const metadata = extractMetadata(parts.params);
    return { src: joinNonAbsoluteUrl(parts), ...metadata };
}
//# sourceMappingURL=zenn-images.js.map