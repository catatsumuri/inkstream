/**
 * Parses a JSON-encoded hProperties value (tree/quiz/chart carry their
 * config this way, since attribute values travel through hProperties as
 * strings). Returns null on missing or malformed input.
 */
export function parseJsonProp<T>(value: string | undefined): T | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}
