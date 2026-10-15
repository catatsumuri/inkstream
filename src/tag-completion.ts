// Parser-owned metadata stays out of the public AST and serialized attributes.
const completions = new WeakMap<object, boolean>();

export function markTagCompletion<T extends object>(node: T, complete: boolean): T {
    completions.set(node, complete);
    return node;
}

export function getTagCompletion(node: object): boolean | undefined {
    return completions.get(node);
}
