import type { ReactNode } from 'react';
import type { Components } from 'react-markdown';
/**
 * Props react-markdown passes to the custom elements emitted by the
 * inkstream remark plugins (aside, card, steps, tree, quiz, chart, ...).
 * All attribute values arrive as strings because they travel through
 * hProperties.
 */
export interface InkstreamElementProps {
    children?: ReactNode;
    className?: string;
    title?: string;
    href?: string;
    cols?: string;
    color?: string;
    tip?: string;
    tree?: string;
    quiz?: string;
    chart?: string;
    label?: string;
    description?: string;
    tags?: string;
    name?: string;
    type?: string;
    required?: string;
    deprecated?: string;
    default?: string;
    path?: string;
    query?: string;
    body?: string;
    url?: string;
}
/**
 * Default renderers for every custom element the inkstream remark plugins
 * emit. They carry stable `ink-*` class names and no visual opinions, so
 * consumers style them with plain CSS (or replace individual renderers via
 * the `components` prop of InkstreamMarkdown). The tag names are not part
 * of react-markdown's Components type, hence the cast at the end.
 */
export declare const inkstreamDefaultComponents: Components;
//# sourceMappingURL=default-components.d.ts.map