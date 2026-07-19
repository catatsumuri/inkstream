import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { normalizeInkstreamMarkdown } from './normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from './remark-plugins.js';
import { parseWikilinkMatch, WIKILINK_RE } from './wikilink-label.js';
const processor = unified().use(remarkParse).use(inkstreamRemarkPlugins);
/**
 * Node types whose children are an inline (phrasing) run and should
 * concatenate directly, with no separator -- `**bold** text` must not
 * gain a space it didn't have. Everything else (paragraphs, headings,
 * list items, containers, ...) is treated as block-level and its
 * children are joined with blank lines, which is the safer default for
 * search text: an extra blank line is harmless, a missing one smashes
 * unrelated words together.
 */
const PHRASING_CONTAINER_TYPES = new Set([
    'paragraph',
    'heading',
    'strong',
    'emphasis',
    'delete',
    'link',
    'linkReference',
    'tableCell',
]);
function resolveWikilinksInText(value) {
    return value.replace(WIKILINK_RE, (_match, rawPath, rawLabel) => parseWikilinkMatch(rawPath, rawLabel).label);
}
function extractQuizText(quiz) {
    return [
        quiz.question,
        ...quiz.options.map((option) => option.text),
        quiz.hint,
        quiz.incorrect,
        quiz.correctMessage,
        quiz.explanation,
    ]
        .filter((value) => Boolean(value))
        .join('\n\n');
}
function collectTreeNodeNames(nodes) {
    return nodes.flatMap((node) => [
        node.name,
        ...(node.children ? collectTreeNodeNames(node.children) : []),
    ]);
}
function extractChartText(chart) {
    return [chart.title, ...chart.data.map((point) => point.label)]
        .filter((value) => Boolean(value))
        .join('\n\n');
}
function parseJsonProperty(value) {
    if (typeof value !== 'string') {
        return null;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
/**
 * Extracts a mintlifyContainer's searchable text. tree/quiz/chart carry
 * their content as a JSON string in hProperties with no mdast children
 * (see remark-code-fence-components.ts / remark-tree-tags.ts), so a
 * plain child walk would silently lose a quiz's question or a chart's
 * labels; every other container (Card, Note, Steps, ...) has real mdast
 * children and is walked normally by extractNodeText.
 */
function extractContainerText(node) {
    const hProperties = node.data?.hProperties;
    if (!hProperties) {
        return null;
    }
    const quiz = parseJsonProperty(hProperties.quiz);
    if (quiz) {
        return extractQuizText(quiz);
    }
    const tree = parseJsonProperty(hProperties.tree);
    if (tree) {
        return collectTreeNodeNames(tree).join('\n\n');
    }
    const chart = parseJsonProperty(hProperties.chart);
    if (chart) {
        return extractChartText(chart);
    }
    return null;
}
function isParent(node) {
    return Array.isArray(node.children);
}
function extractNodeText(node) {
    switch (node.type) {
        case 'text':
        case 'inlineCode':
            return resolveWikilinksInText(node.value);
        case 'code':
            // A leaf node (value, no children) like text/inlineCode above,
            // but its content is a real code sample, not prose -- kept
            // as-is (searchable) rather than routed through the wikilink
            // resolver, which a code sample's contents have no business
            // being rewritten by.
            return node.value;
        case 'break':
            return '\n';
        case 'image':
        case 'imageReference':
            return node.alt ?? '';
        case 'mintlifyContainer': {
            const containerText = extractContainerText(node);
            if (containerText !== null) {
                return containerText;
            }
            break;
        }
        default:
            break;
    }
    if (!isParent(node)) {
        return '';
    }
    const separator = PHRASING_CONTAINER_TYPES.has(node.type) ? '' : '\n\n';
    return node.children
        .map((child) => extractNodeText(child))
        .filter((text) => text !== '')
        .join(separator);
}
/**
 * Renders inkstream markdown down to its plain, human-readable text:
 * every Mintlify tag, Zenn directive, and GFM extension resolved through
 * the same remark pipeline InkstreamMarkdown uses, with no syntax noise
 * (`<Card title=...>`, ` ```quiz `, `[[path|label]]`) and no markup.
 * Intended for full-text search indexing, excerpts, and OGP
 * descriptions, where the raw markdown source is unusable as-is.
 *
 * tree/quiz/chart fences contribute their meaningful text (a quiz's
 * question and options, a chart's title and labels, a tree's file and
 * folder names) rather than being silently dropped or dumping raw JSON.
 * Wikilinks resolve to their label (or the path's last segment) without
 * needing a resolver, matching how a heading's slug is computed.
 */
export function extractPlainText(markdown) {
    const normalized = normalizeInkstreamMarkdown(markdown);
    const tree = processor.runSync(processor.parse(normalized));
    return extractNodeText(tree)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
//# sourceMappingURL=extract-plain-text.js.map