/**
 * Creates a per-document id dispenser that appends `-2`, `-3`, ... to
 * duplicate base ids, mirroring extractMarkdownHeadings' numbering. The
 * `self` token gives each mounted heading a stable identity so React
 * Strict Mode's double-invoke doesn't increment the counter twice for the
 * same heading.
 */
export function createHeadingIdDispenser() {
    const idCounts = new Map();
    const assignedIds = new WeakMap();
    return (baseId, self) => {
        const existingId = assignedIds.get(self);
        if (existingId) {
            return existingId;
        }
        const count = (idCounts.get(baseId) ?? 0) + 1;
        const id = count === 1 ? baseId : `${baseId}-${count}`;
        idCounts.set(baseId, count);
        assignedIds.set(self, id);
        return id;
    };
}
//# sourceMappingURL=heading-id-dispenser.js.map