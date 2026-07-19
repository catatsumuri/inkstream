import { parseChartFence } from './parse-chart-fence.js';
import { parseQuizFence } from './parse-quiz-fence.js';
import { parseTreeFence } from './parse-tree-fence.js';
function createComponent(name, hName, json) {
    return {
        type: 'mintlifyContainer',
        name,
        attributes: {},
        children: [],
        data: { hName, hProperties: { [hName]: json } },
    };
}
function transformCode(code, file) {
    if (code.lang === 'tree') {
        return createComponent('Tree', 'tree', JSON.stringify(parseTreeFence(code.value)));
    }
    if (code.lang === 'quiz') {
        const quiz = parseQuizFence(code.value);
        if (quiz === null) {
            file.message('Malformed quiz fence (needs question:, correct:, and at least two A:/B:/... options); left as a plain code block', code);
            return null;
        }
        return createComponent('Quiz', 'quiz', JSON.stringify(quiz));
    }
    const chartMatch = /^chart:(bar|radar)$/.exec(code.lang ?? '');
    if (chartMatch) {
        const chart = parseChartFence(chartMatch[1], code.value);
        if (chart === null) {
            file.message('Malformed chart fence (needs at least one "label: value" line); left as a plain code block', code);
            return null;
        }
        return createComponent('Chart', 'chart', JSON.stringify(chart));
    }
    return null;
}
function transform(parent, file) {
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === 'code') {
            const replacement = transformCode(child, file);
            if (replacement) {
                children[i] = replacement;
            }
            continue;
        }
        if ('children' in child) {
            transform(child, file);
        }
    }
}
/**
 * Remark plugin: converts ` ```tree `, ` ```quiz `, and ` ```chart:bar ` /
 * ` ```chart:radar ` fenced code blocks into `mintlifyContainer` nodes
 * carrying the parsed structure as a single JSON-string property (`tree`,
 * `quiz`, or `chart`), for a renderer component to read and build UI from.
 * Malformed fences emit a vfile warning and are left as plain code blocks
 * instead of failing the whole document.
 */
export function remarkCodeFenceComponents() {
    return (tree, file) => {
        transform(tree, file);
    };
}
//# sourceMappingURL=remark-code-fence-components.js.map