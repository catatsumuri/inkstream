import type { Parent, Root, RootContent } from 'mdast';
import type { VFile } from 'vfile';
export interface MintlifyContainer extends Parent {
    type: 'mintlifyContainer';
    name: string;
    attributes: Record<string, string>;
    children: RootContent[];
    data?: {
        hName?: string;
        hProperties?: Record<string, string | string[]>;
    };
}
declare module 'mdast' {
    interface RootContentMap {
        mintlifyContainer: MintlifyContainer;
    }
    interface BlockContentMap {
        mintlifyContainer: MintlifyContainer;
    }
    interface PhrasingContentMap {
        mintlifyContainer: MintlifyContainer;
    }
}
/**
 * Remark plugin: builds Mintlify component containers by pairing tags on the
 * mdast tree. Run `normalizeMintlifyBlocks` on the source text first so each
 * standalone tag line parses as its own `html` node.
 */
export declare function remarkMintlifyTags(): (tree: Root, file: VFile) => void;
//# sourceMappingURL=remark-mintlify-tags.d.ts.map