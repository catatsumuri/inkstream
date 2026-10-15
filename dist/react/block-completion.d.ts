import type { Components } from 'react-markdown';
import type { Root } from 'mdast';
import { type GenerativeUiEvent } from './generative-ui-context.js';
/** Only the React Generative UI pipeline adds this renderer-owned property. */
export declare function remarkBlockCompletion(): (tree: Root) => void;
export declare const BlockCompletionContext: import("react").Context<{
    enabled: boolean;
    generating: boolean;
    pendingAncestor: boolean;
    onEvent?: (event: GenerativeUiEvent) => void;
}>;
/** Stable types also survive new components-prop objects with the same renderers. */
export declare function withBlockCompletion(components: Components): Components;
//# sourceMappingURL=block-completion.d.ts.map