import type { ReactNode } from 'react';
import type { Components } from 'react-markdown';
import type { HeadingIdDispenser } from '../heading-id-dispenser.js';
export interface HeadingIdContextValue {
    dispense: HeadingIdDispenser;
    prefix?: string;
}
/**
 * Provides the per-document id dispenser (and optional id prefix) to the
 * heading renderers. InkstreamMarkdown supplies it; without a provider the
 * renderers fall back to un-deduplicated base ids.
 */
export declare const HeadingIdContext: import("react").Context<HeadingIdContextValue | null>;
/**
 * Collects the plain text of a rendered heading's children, descending
 * through inline elements and using image alt text, so the slug matches
 * what extractMarkdownHeadings computes from the markdown source.
 */
export declare function extractRenderedHeadingText(node: ReactNode): string;
/**
 * Default renderers for h1–h4: each heading gets a slug-derived id (deep
 * links and tables of contents built from extractMarkdownHeadings resolve
 * to it) and a copy-link anchor. h5/h6 are left to the browser defaults —
 * extractMarkdownHeadings stops at #### too.
 */
export declare const headingComponents: Pick<Components, 'h1' | 'h2' | 'h3' | 'h4'>;
//# sourceMappingURL=heading-components.d.ts.map