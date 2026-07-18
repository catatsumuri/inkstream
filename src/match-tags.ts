import { MINTLIFY_BLOCK_TAG_NAMES } from './manifest.js';
import { parseJsxAttributes } from './parse-jsx-attributes.js';

const TAG_NAME_PATTERN = MINTLIFY_BLOCK_TAG_NAMES.join('|');

const OPEN_TAG_RE = new RegExp(
    `^<(?<tag>${TAG_NAME_PATTERN})(?<attrs>\\s[^>]*?)?\\s*(?<selfClosing>/)?>\\s*$`,
);

const CLOSE_TAG_RE = new RegExp(`^</(?<tag>${TAG_NAME_PATTERN})>\\s*$`);

export interface OpenTagMatch {
    name: string;
    attributes: Record<string, string>;
    selfClosing: boolean;
}

/** Matches a string that is exactly one Mintlify open tag. */
export function matchOpenTag(value: string): OpenTagMatch | null {
    const match = OPEN_TAG_RE.exec(value.trim());

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
export function matchCloseTag(value: string): { name: string } | null {
    const match = CLOSE_TAG_RE.exec(value.trim());

    if (!match?.groups) {
        return null;
    }

    return { name: match.groups.tag };
}

const TAG_LINE_RE = new RegExp(
    `^</?(?:${TAG_NAME_PATTERN})(?:\\s[^>]*?)?\\s*/?>$`,
);

/** Returns true if the trimmed line consists solely of one Mintlify tag. */
export function isTagLine(line: string): boolean {
    return TAG_LINE_RE.test(line.trim());
}
