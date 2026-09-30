import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CircleCheck, CircleX } from 'lucide-react';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import { lazy, Suspense, useState } from 'react';
import { parseJsonProp } from '../parse-json-prop.js';
import { parseImageMetadata } from '../zenn-images.js';
import { CodeBlock } from './code-block.js';
import { GithubEmbed, LinkCard, YoutubeEmbed } from './embed-components.js';
import { headingComponents } from './heading-components.js';
function classNames(...tokens) {
    return tokens.filter(Boolean).join(' ');
}
const lucideIconNames = new Set(iconNames);
/**
 * A Lucide icon addressed by its kebab-case name (Mintlify's `icon`
 * attribute). Icons load lazily, so a same-sized placeholder keeps the
 * layout stable until the icon arrives; unknown names render nothing.
 */
function InkIcon({ name }) {
    if (!lucideIconNames.has(name)) {
        return null;
    }
    return (_jsx(DynamicIcon, { name: name, className: "ink-icon", "aria-hidden": "true", "data-icon": name, fallback: () => (_jsx("span", { className: "ink-icon", "aria-hidden": "true", "data-icon": name })) }));
}
function TreeNodeItem({ node }) {
    if (node.type === 'file') {
        return _jsx("li", { className: "ink-tree-file", children: node.name });
    }
    return (_jsx("li", { className: "ink-tree-folder", children: _jsxs("details", { open: node.defaultOpen, children: [_jsx("summary", { className: "ink-tree-folder-name", children: node.name }), _jsx("ul", { className: "ink-tree-children", children: (node.children ?? []).map((child, index) => (_jsx(TreeNodeItem, { node: child }, index))) })] }) }));
}
function ApiField({ name, type, required, deprecated, location, children, }) {
    return (_jsxs("div", { className: "ink-api-field", children: [_jsxs("p", { className: "ink-api-field-head", children: [_jsx("span", { className: "ink-api-field-name", children: name }), location && (_jsx("span", { className: "ink-api-field-location", children: location })), type && _jsx("span", { className: "ink-api-field-type", children: type }), required === 'true' && (_jsx("span", { className: "ink-api-field-required", children: "required" })), deprecated === 'true' && (_jsx("span", { className: "ink-api-field-deprecated", children: "deprecated" }))] }), _jsx("div", { className: "ink-api-field-body", children: children })] }));
}
function QuizRenderer({ quiz }) {
    const content = parseJsonProp(quiz);
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [submittedLabel, setSubmittedLabel] = useState(null);
    if (!content) {
        return null;
    }
    const selectedOption = content.options.find((option) => option.label === selectedLabel);
    const submittedOption = content.options.find((option) => option.label === submittedLabel);
    const isSubmitted = submittedLabel !== null;
    const isCorrect = submittedLabel === content.correct;
    const statusLabel = isCorrect
        ? (content.correctMessage ?? 'Correct')
        : (content.incorrect ?? 'Not Quite');
    return (_jsxs("div", { className: "ink-quiz", children: [_jsx("p", { className: "ink-quiz-question", children: content.question }), isSubmitted && submittedOption ? (_jsxs("div", { className: "ink-quiz-result", children: [_jsx("span", { className: "ink-quiz-result-label", children: submittedOption.label }), _jsx("p", { className: "ink-quiz-result-text", children: submittedOption.text }), _jsxs("p", { className: classNames('ink-quiz-status', isCorrect
                            ? 'ink-quiz-status-correct'
                            : 'ink-quiz-status-incorrect'), children: [isCorrect ? (_jsx(CircleCheck, { className: "ink-quiz-status-icon" })) : (_jsx(CircleX, { className: "ink-quiz-status-icon" })), statusLabel] }), !isCorrect && content.hint && (_jsxs("p", { className: "ink-quiz-hint", children: ["Hint: ", content.hint] })), isCorrect && content.explanation && (_jsx("p", { className: "ink-quiz-explanation", children: content.explanation })), _jsx("button", { type: "button", className: "ink-quiz-retry", onClick: () => {
                            setSelectedLabel(null);
                            setSubmittedLabel(null);
                        }, children: "Try Again" })] })) : (_jsxs("div", { className: "ink-quiz-form", children: [_jsx("ul", { className: "ink-quiz-options", children: content.options.map((option) => (_jsx("li", { children: _jsxs("button", { type: "button", className: classNames('ink-quiz-option', selectedLabel === option.label &&
                                    'ink-quiz-option-selected'), onClick: () => setSelectedLabel(option.label), children: [_jsx("span", { className: "ink-quiz-option-label", children: option.label }), _jsx("span", { className: "ink-quiz-option-text", children: option.text })] }) }, option.label))) }), _jsx("button", { type: "button", className: "ink-quiz-submit", disabled: !selectedOption, onClick: () => selectedOption &&
                            setSubmittedLabel(selectedOption.label), children: "Check Answer" })] }))] }));
}
function ChartLoadFallback() {
    return (_jsx("p", { className: "ink-chart-error", children: "Failed to load chart. Please refresh and try again." }));
}
// recharts is an optional peer dependency and a sizeable bundle, so the
// real renderer lives in its own module and is loaded lazily (mirroring
// MermaidDiagram in code-block.tsx) rather than imported statically here.
const LazyChartRenderer = lazy(async () => {
    try {
        const module = await import('./chart-renderer.js');
        return { default: module.ChartRenderer };
    }
    catch {
        return { default: ChartLoadFallback };
    }
});
function ChartRenderer(props) {
    return (_jsx(Suspense, { fallback: _jsx("div", { className: "ink-chart-loading" }), children: _jsx(LazyChartRenderer, { ...props }) }));
}
/**
 * Default renderers for every custom element the inkstream remark plugins
 * emit. They carry stable `ink-*` class names and no visual opinions, so
 * consumers style them with plain CSS (or replace individual renderers via
 * the `components` prop of InkstreamMarkdown). The tag names are not part
 * of react-markdown's Components type, hence the cast at the end.
 */
export const inkstreamDefaultComponents = {
    aside: ({ className, children }) => {
        const variant = className?.split(' ').find((token) => token !== 'msg') ?? 'info';
        return (_jsx("aside", { className: classNames('ink-callout', `ink-callout-${variant}`), children: children }));
    },
    card: ({ title, icon, href, children }) => {
        const body = (_jsxs("div", { className: "ink-card", children: [(title || icon) && (_jsxs("p", { className: "ink-card-title", children: [icon && _jsx(InkIcon, { name: icon }), title] })), children] }));
        return href ? (_jsx("a", { href: href, className: "ink-card-link", children: body })) : (body);
    },
    cardgroup: ({ cols, children }) => (_jsx("div", { className: "ink-card-group", "data-cols": cols, children: children })),
    columns: ({ cols, children }) => (_jsx("div", { className: "ink-columns", "data-cols": cols, children: children })),
    steps: ({ children }) => (_jsx("ol", { className: "ink-steps", children: children })),
    step: ({ title, children }) => (_jsxs("li", { className: "ink-step", children: [title && _jsx("p", { className: "ink-step-title", children: title }), children] })),
    tabs: ({ children }) => (_jsx("div", { className: "ink-tabs", children: children })),
    tab: ({ title, children }) => (_jsxs("section", { className: "ink-tab", children: [title && _jsx("p", { className: "ink-tab-title", children: title }), children] })),
    accordiongroup: ({ children }) => (_jsx("div", { className: "ink-accordion-group", children: children })),
    accordion: ({ title, icon, children }) => (_jsxs("details", { className: "ink-accordion", children: [_jsxs("summary", { className: "ink-accordion-title", children: [icon && _jsx(InkIcon, { name: icon }), title ?? 'Details'] }), _jsx("div", { className: "ink-accordion-body", children: children })] })),
    expandable: ({ title, defaultOpen, children }) => (_jsxs("details", { className: "ink-expandable", open: defaultOpen === 'true', children: [_jsx("summary", { className: "ink-expandable-title", children: title ?? 'Details' }), _jsx("div", { className: "ink-expandable-body", children: children })] })),
    badge: ({ color, children }) => (_jsx("span", { className: classNames('ink-badge', Boolean(color) && `ink-badge-${color}`), children: children })),
    tooltip: ({ tip, children }) => (_jsx("span", { className: "ink-tooltip", title: tip, children: children })),
    img: ({ src, alt }) => {
        const { src: cleanSrc, width, height, caption, } = parseImageMetadata(src);
        const image = (_jsx("img", { src: cleanSrc, alt: alt ?? '', width: width, height: height, className: "ink-image" }));
        if (!caption) {
            return image;
        }
        return (_jsxs("span", { className: "ink-figure", children: [image, _jsx("span", { className: "ink-figure-caption", children: caption })] }));
    },
    update: ({ label, description, tags, children }) => (_jsxs("section", { className: "ink-update", children: [_jsxs("div", { className: "ink-update-meta", children: [label && _jsx("p", { className: "ink-update-label", children: label }), description && (_jsx("p", { className: "ink-update-description", children: description })), tags && (_jsx("p", { className: "ink-update-tags", children: tags.split(',').map((tag) => (_jsx("span", { className: "ink-update-tag", children: tag }, tag))) }))] }), _jsx("div", { className: "ink-update-body", children: children })] })),
    codegroup: ({ children }) => (_jsx("div", { className: "ink-code-group", children: children })),
    responsefield: (props) => _jsx(ApiField, { ...props }),
    paramfield: (props) => {
        const location = props.path
            ? ['path', props.path]
            : props.query
                ? ['query', props.query]
                : props.body
                    ? ['body', props.body]
                    : undefined;
        return (_jsx(ApiField, { ...props, name: location ? location[1] : props.name, location: location?.[0] }));
    },
    tree: ({ tree }) => {
        const nodes = parseJsonProp(tree);
        if (!nodes) {
            return null;
        }
        return (_jsx("ul", { className: "ink-tree", children: nodes.map((node, index) => (_jsx(TreeNodeItem, { node: node }, index))) }));
    },
    quiz: QuizRenderer,
    chart: ChartRenderer,
    linkcard: ({ url }) => _jsx(LinkCard, { url: url }),
    youtubeembed: ({ url }) => _jsx(YoutubeEmbed, { url: url }),
    githubembed: ({ url }) => _jsx(GithubEmbed, { url: url }),
    ...headingComponents,
    code: CodeBlock,
    // CodeBlock renders its own <pre> inside the .ink-code-block container,
    // so the default <pre> wrapper is unwrapped to a fragment.
    pre: ({ children }) => _jsx(_Fragment, { children: children }),
};
//# sourceMappingURL=default-components.js.map