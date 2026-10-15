import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, createElement, useContext } from 'react';
import { MINTLIFY_BLOCK_TAG_NAMES, MINTLIFY_INLINE_TAG_NAMES, GENERATIVE_UI_BLOCK_TAG_NAMES, GENERATIVE_UI_INLINE_TAG_NAMES, } from '../manifest.js';
import { getTagCompletion } from '../tag-completion.js';
import { GenerativeUiContext, useGenerativeUiContext, } from './generative-ui-context.js';
const rendererNames = new Set([
    ...MINTLIFY_BLOCK_TAG_NAMES, ...MINTLIFY_INLINE_TAG_NAMES,
    ...GENERATIVE_UI_BLOCK_TAG_NAMES, ...GENERATIVE_UI_INLINE_TAG_NAMES,
].map(name => name.toLowerCase()));
rendererNames.add('aside');
const COMPLETE_PROPERTY = 'data-inkstream-block-complete';
/** Only the React Generative UI pipeline adds this renderer-owned property. */
export function remarkBlockCompletion() {
    return (tree) => {
        function visit(node) {
            const childrenComplete = 'children' in node
                ? node.children.map(child => visit(child)).every(Boolean)
                : true;
            const complete = getTagCompletion(node) !== false && childrenComplete;
            if (node.type === 'mintlifyContainer') {
                const container = node;
                container.data ??= {};
                container.data.hProperties ??= {};
                container.data.hProperties[COMPLETE_PROPERTY] = complete ? 'true' : 'false';
            }
            return complete;
        }
        visit(tree);
    };
}
export const BlockCompletionContext = createContext({ enabled: false, generating: false, pendingAncestor: false });
const componentWrappers = new WeakMap();
const elementWrappers = new Map();
/** Stable types also survive new components-prop objects with the same renderers. */
export function withBlockCompletion(components) {
    return Object.fromEntries(Object.entries(components).map(([name, Component]) => {
        // Select identifies Option elements before rendering their children.
        if (!Component || !rendererNames.has(name) || name === 'option')
            return [name, Component];
        const cached = typeof Component === 'string'
            ? elementWrappers.get(Component)
            : componentWrappers.get(Component);
        if (cached)
            return [name, cached];
        function CompletionRenderer(props) {
            const context = useGenerativeUiContext();
            const block = useContext(BlockCompletionContext);
            const completed = props.node?.properties?.[COMPLETE_PROPERTY];
            const { node, [COMPLETE_PROPERTY]: marker, ...nativeProps } = props;
            const rendered = createElement(Component, typeof Component === 'string' ? nativeProps : props);
            if (completed === undefined)
                return rendered;
            const pending = block.pendingAncestor || completed !== 'true';
            const streaming = block.enabled ? block.generating && pending : context.streaming;
            return (_jsx(BlockCompletionContext.Provider, { value: { ...block, pendingAncestor: pending }, children: _jsx(GenerativeUiContext.Provider, { value: {
                        ...context,
                        streaming,
                        onEvent: event => {
                            if (!streaming) {
                                if (block.enabled)
                                    block.onEvent?.(event);
                                else
                                    context.onEvent?.(event);
                            }
                        },
                    }, children: rendered }) }));
        }
        if (typeof Component === 'string')
            elementWrappers.set(Component, CompletionRenderer);
        else
            componentWrappers.set(Component, CompletionRenderer);
        return [name, CompletionRenderer];
    }));
}
//# sourceMappingURL=block-completion.js.map