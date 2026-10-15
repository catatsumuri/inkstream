// Parser-owned metadata stays out of the public AST and serialized attributes.
const completions = new WeakMap();
export function markTagCompletion(node, complete) {
    completions.set(node, complete);
    return node;
}
export function getTagCompletion(node) {
    return completions.get(node);
}
//# sourceMappingURL=tag-completion.js.map