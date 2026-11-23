import type { Root } from 'mdast';
/** Resolve only known providers; arbitrary author-supplied iframe URLs are rejected. */
export declare function resolveZennEmbed(type: string, value: string): string | undefined;
/** Handle explicit Zenn embeds before the generic standalone-link transform. */
export declare function remarkZennEmbeds(): (tree: Root, file: {
    value: unknown;
}) => void;
//# sourceMappingURL=zenn-embeds.d.ts.map