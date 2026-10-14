import { MINTLIFY_BLOCK_TAG_NAMES, MINTLIFY_INLINE_TAG_NAMES, } from './manifest.js';
import { parseJsxAttributes } from './parse-jsx-attributes.js';
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// Attribute text of an open tag: any run of non-`>` characters, where a
// quoted string (`"map<string, X>"`) may itself contain `>`.
const TAG_ATTRS_PATTERN = `(?:[^>"']|"[^"]*"|'[^']*')*?`;
const tagPatternCache = new Map();
function patternsFor(tagNames) {
    const key = tagNames.join('\u0000');
    const cached = tagPatternCache.get(key);
    if (cached) {
        return cached;
    }
    const names = tagNames.map(escapeRegExp).join('|') || '(?!)';
    const patterns = {
        open: new RegExp(`^<(?<tag>${names})(?<attrs>\\s${TAG_ATTRS_PATTERN})?\\s*(?<selfClosing>/)?>\\s*$`),
        close: new RegExp(`^</(?<tag>${names})>\\s*$`),
        line: new RegExp(`^</?(?:${names})(?:\\s${TAG_ATTRS_PATTERN})?\\s*/?>$`),
    };
    tagPatternCache.set(key, patterns);
    return patterns;
}
/** Matches a string that is exactly one Mintlify open tag. */
export function matchOpenTag(value, tagNames = [
    ...MINTLIFY_BLOCK_TAG_NAMES,
    ...MINTLIFY_INLINE_TAG_NAMES,
]) {
    const match = patternsFor(tagNames).open.exec(value.trim());
    if (!match?.groups) {
        return null;
    }
    return {
        name: match.groups.tag,
        attributes: parseJsxAttributes(match.groups.attrs ?? ''),
        selfClosing: match.groups.selfClosing !== undefined,
    };
}
/** Matches a string that is exactly one Mintlify close tag. */
export function matchCloseTag(value, tagNames = [
    ...MINTLIFY_BLOCK_TAG_NAMES,
    ...MINTLIFY_INLINE_TAG_NAMES,
]) {
    const match = patternsFor(tagNames).close.exec(value.trim());
    if (!match?.groups) {
        return null;
    }
    return { name: match.groups.tag };
}
/**
 * Returns true if the trimmed line consists solely of one Mintlify block
 * tag. Inline tags (Badge, Tooltip) are excluded on purpose: they're meant
 * to sit mid-sentence, so `normalizeMintlifyBlocks` must not isolate them
 * onto their own blank-line-delimited block.
 */
export function isTagLine(line, blockTagNames = MINTLIFY_BLOCK_TAG_NAMES) {
    return patternsFor(blockTagNames).line.test(line.trim());
}
//# sourceMappingURL=match-tags.js.map