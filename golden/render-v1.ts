import { toHtml } from 'hast-util-to-html';
import {
    preprocessMarkdownContent,
    preprocessMarkdownSyntax,
    remarkAccordionGroupDirective,
    remarkApiFieldsDirective,
    remarkBadgeDirective,
    remarkCardDirective,
    remarkChartDirective,
    remarkCodeGroupDirective,
    remarkFallbackDirective,
    remarkGithubAlerts,
    remarkQuizDirective,
    remarkStepsDirective,
    remarkTabsDirective,
    remarkTooltipDirective,
    remarkTreeDirective,
    remarkUpdateDirective,
    remarkZennDirective,
} from '@catatsumuri/inkstream/syntax';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * The full intended v1 pipeline: every remark-*-directive plugin the
 * package ships, wired together the way a consumer rendering all Mintlify
 * components (not just the zenn-directive contract-freeze subset) would.
 * Order matches inkstream's own tests/markdown-pipeline.ts plus the
 * component-directive plugins it deliberately excludes from that harness.
 */
const processor = unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkDirective)
    .use(remarkZennDirective)
    .use(remarkGithubAlerts)
    .use(remarkCardDirective)
    .use(remarkTabsDirective)
    .use(remarkStepsDirective)
    .use(remarkAccordionGroupDirective)
    .use(remarkApiFieldsDirective)
    .use(remarkCodeGroupDirective)
    .use(remarkUpdateDirective)
    .use(remarkBadgeDirective)
    .use(remarkTooltipDirective)
    .use(remarkTreeDirective)
    .use(remarkQuizDirective)
    .use(remarkChartDirective)
    .use(remarkFallbackDirective)
    .use(remarkRehype, { allowDangerousHtml: true });

interface WalkableNode {
    type?: string;
    children?: unknown[];
}

/** react-markdown renders hast `raw` nodes as literal text; mirror that. */
function convertRawNodesToText(node: WalkableNode): void {
    if (node.type === 'raw') {
        node.type = 'text';
    }

    for (const child of node.children ?? []) {
        convertRawNodesToText(child as WalkableNode);
    }
}

export function renderV1(markdown: string): string {
    const preprocessed = preprocessMarkdownContent(
        preprocessMarkdownSyntax(markdown),
    );
    const mdast = processor.parse(preprocessed);
    const hast = processor.runSync(mdast);

    convertRawNodesToText(hast as WalkableNode);

    return toHtml(hast);
}
