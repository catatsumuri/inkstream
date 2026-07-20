/**
 * Parses a JSON-encoded hProperties value (tree/quiz/chart carry their
 * config this way, since attribute values travel through hProperties as
 * strings). Returns null on missing or malformed input.
 */
export function parseJsonProp(value) {
    if (!value) {
        return null;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=parse-json-prop.js.map