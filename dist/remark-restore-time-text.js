function isParent(node) {
    return Array.isArray(node.children);
}
/**
 * `remark-directive` also parses clock times such as `09:12` as an inline
 * directive. Restore those nodes to text before they reach remark-rehype.
 */
export function remarkRestoreTimeText() {
    return (tree) => {
        const visit = (node) => {
            if (!isParent(node))
                return;
            for (const child of node.children)
                visit(child);
            for (let index = 1; index < node.children.length; index += 1) {
                const previous = node.children[index - 1];
                const current = node.children[index];
                if (previous.type !== 'text' ||
                    current.type !== 'textDirective' ||
                    typeof previous.value !== 'string' ||
                    typeof current.name !== 'string' ||
                    Object.keys(current.attributes ?? {}).length > 0 ||
                    (current.children?.length ?? 0) > 0 ||
                    previous.position?.end.offset !==
                        current.position?.start.offset) {
                    continue;
                }
                const hour = /(?:^|\D)([01]\d|2[0-3])$/u.exec(previous.value);
                const minute = /^([0-5]\d)(\D.*)?$/u.exec(current.name);
                if (!hour || !minute)
                    continue;
                previous.value += `:${current.name}`;
                if (previous.position && current.position) {
                    previous.position.end = current.position.end;
                }
                node.children.splice(index, 1);
                index -= 1;
            }
        };
        visit(tree);
    };
}
//# sourceMappingURL=remark-restore-time-text.js.map