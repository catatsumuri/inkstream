import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CircleCheck, CircleX } from 'lucide-react';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import { Children, createContext, isValidElement, useContext, } from 'react';
import { lazy, Suspense, useState, useEffect } from 'react';
import { parseJsonProp } from '../parse-json-prop.js';
import { parseImageMetadata } from '../zenn-images.js';
import { CodeBlock } from './code-block.js';
import { GithubEmbed, LinkCard, YoutubeEmbed } from './embed-components.js';
import { useGenerativeUiContext } from './generative-ui-context.js';
import { headingComponents } from './heading-components.js';
function classNames(...tokens) {
    return tokens.filter(Boolean).join(' ');
}
function spacingStyle(value) {
    if (value === undefined || !/^[0-8]$/.test(value)) {
        return undefined;
    }
    return { gap: `${Number(value) * 0.25}rem` };
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
const GenerativeUiFormContext = createContext(false);
function GenerativeUiForm({ id, action, children }) {
    const insideForm = useContext(GenerativeUiFormContext);
    const { onEvent } = useGenerativeUiContext();
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(true), []);
    if (insideForm)
        return null;
    const valid = Boolean(id && action);
    return (_jsx(GenerativeUiFormContext.Provider, { value: true, children: _jsx("form", { className: "ink-ui-form", onSubmit: (event) => {
                event.preventDefault();
                if (!id || !action || !ready)
                    return;
                const form = event.currentTarget;
                const entries = [];
                const ids = new Set();
                // Read rendered controls so untouched defaults and browser
                // normalization are included without a second state store.
                const controls = form.querySelectorAll('[data-ink-ui-field]');
                for (const control of Array.from(controls)) {
                    if (control.form !== form || control.disabled)
                        continue;
                    if (!control.id || ids.has(control.id))
                        return;
                    ids.add(control.id);
                    const kind = control.getAttribute('data-ink-ui-field');
                    let value;
                    if (kind === 'boolean') {
                        value = control.checked;
                    }
                    else if (kind === 'number') {
                        value = control.valueAsNumber;
                        if (!Number.isFinite(value))
                            return;
                    }
                    else if (kind === 'string') {
                        value = control.value;
                    }
                    else {
                        continue;
                    }
                    entries.push([control.id, value]);
                }
                onEvent?.({
                    type: 'submit',
                    id,
                    action,
                    values: Object.fromEntries(entries),
                });
            }, children: _jsx("fieldset", { disabled: !valid || !ready, children: children }) }) }));
}
function GenerativeUiButton({ action, type, children }) {
    const { onEvent } = useGenerativeUiContext();
    const insideForm = useContext(GenerativeUiFormContext);
    const submit = type === 'submit';
    const buttonContent = Children.map(children, (child) => isValidElement(child) && child.type === 'p' ? (_jsx("span", { className: "ink-ui-button-label", children: child.props.children })) : (child));
    return (_jsx("button", { type: submit ? 'submit' : 'button', className: "ink-ui-button", disabled: submit ? !insideForm : !action, onClick: () => !submit && action && onEvent?.({ type: 'action', action }), children: buttonContent }));
}
function GenerativeUiSlider({ id, label, min = '0', max = '100', step = '1', default: defaultValue = '50', }) {
    const { values, onEvent } = useGenerativeUiContext();
    if (!id) {
        return null;
    }
    const minimum = Number(min);
    const maximum = Number(max);
    const increment = Number(step);
    const initial = Number(defaultValue);
    if (!Number.isFinite(minimum) ||
        !Number.isFinite(maximum) ||
        !Number.isFinite(increment) ||
        !Number.isFinite(initial) ||
        minimum >= maximum ||
        increment <= 0) {
        return null;
    }
    const clamp = (value) => Math.min(maximum, Math.max(minimum, value));
    const externalValue = values?.[id];
    const controlledValue = typeof externalValue === 'number' && Number.isFinite(externalValue)
        ? clamp(externalValue)
        : undefined;
    const accessibleLabel = label ?? id;
    return (_jsxs("label", { className: "ink-ui-slider", children: [label && _jsx("span", { className: "ink-ui-slider-label", children: label }), _jsx("input", { id: id, type: "range", min: minimum, max: maximum, step: increment, "data-ink-ui-field": "number", "aria-label": accessibleLabel, ...(controlledValue === undefined
                    ? { defaultValue: clamp(initial) }
                    : { value: controlledValue }), onChange: (event) => {
                    const value = Number(event.currentTarget.value);
                    if (Number.isFinite(value)) {
                        onEvent?.({ type: 'change', id, value });
                    }
                } }, controlledValue === undefined ? 'uncontrolled' : 'controlled')] }));
}
function GenerativeUiInput({ id, label, default: defaultValue = '', placeholder, }) {
    const { values, onEvent } = useGenerativeUiContext();
    if (!id)
        return null;
    const externalValue = values?.[id];
    const controlledValue = typeof externalValue === 'string' ? externalValue : undefined;
    return (_jsxs("label", { className: "ink-ui-input", children: [label && _jsx("span", { children: label }), _jsx("input", { id: id, name: id, type: "text", "data-ink-ui-field": "string", "aria-label": label ?? id, placeholder: placeholder, ...(controlledValue === undefined
                    ? { defaultValue }
                    : { value: controlledValue }), onChange: (event) => onEvent?.({
                    type: 'change', id, value: event.currentTarget.value,
                }) }, controlledValue === undefined ? 'uncontrolled' : 'controlled')] }));
}
const GenerativeUiSelectContext = createContext(false);
function GenerativeUiCheckbox({ id, label, default: defaultValue = 'false', }) {
    const { values, onEvent } = useGenerativeUiContext();
    if (!id) {
        return null;
    }
    const checkedDefault = defaultValue === 'true';
    const externalValue = values?.[id];
    const controlledValue = typeof externalValue === 'boolean' ? externalValue : undefined;
    return (_jsxs("label", { className: "ink-ui-checkbox", children: [_jsx("input", { id: id, name: id, type: "checkbox", "data-ink-ui-field": "boolean", "aria-label": label ?? id, ...(controlledValue === undefined
                    ? { defaultChecked: checkedDefault }
                    : { checked: controlledValue }), onChange: (event) => onEvent?.({
                    type: 'change',
                    id,
                    value: event.currentTarget.checked,
                }) }, controlledValue === undefined ? 'uncontrolled' : 'controlled'), label && _jsx("span", { children: label })] }));
}
function GenerativeUiSelect({ id, label, default: defaultValue, children, }) {
    const { values, onEvent } = useGenerativeUiContext();
    if (!id) {
        return null;
    }
    const selectChildren = Children.toArray(children).flatMap((child) => isValidElement(child) && child.type === 'p'
        ? Children.toArray(child.props.children)
        : [child]);
    const seenOptionValues = new Set();
    const uniqueOptions = selectChildren.filter((child) => {
        if (!isValidElement(child) ||
            child.type !== GenerativeUiOption ||
            typeof child.props.value !== 'string' ||
            seenOptionValues.has(child.props.value)) {
            return false;
        }
        seenOptionValues.add(child.props.value);
        return true;
    });
    const optionValues = [...seenOptionValues];
    if (optionValues.length === 0) {
        return null;
    }
    const externalValue = values?.[id];
    const controlledValue = typeof externalValue === 'string' && optionValues.includes(externalValue)
        ? externalValue
        : undefined;
    const validDefaultValue = defaultValue !== undefined && optionValues.includes(defaultValue)
        ? defaultValue
        : undefined;
    const accessibleLabel = label ?? id;
    return (_jsxs("label", { className: "ink-ui-select", children: [label && _jsx("span", { className: "ink-ui-select-label", children: label }), _jsx(GenerativeUiSelectContext.Provider, { value: true, children: _jsx("select", { id: id, name: id, "data-ink-ui-field": "string", "aria-label": accessibleLabel, ...(controlledValue === undefined
                        ? validDefaultValue === undefined
                            ? {}
                            : { defaultValue: validDefaultValue }
                        : { value: controlledValue }), onChange: (event) => {
                        const value = event.currentTarget.value;
                        if (optionValues.includes(value)) {
                            onEvent?.({ type: 'change', id, value });
                        }
                    }, children: uniqueOptions }, controlledValue === undefined ? 'uncontrolled' : 'controlled') })] }));
}
function GenerativeUiOption({ value, children, }) {
    const insideSelect = useContext(GenerativeUiSelectContext);
    if (!insideSelect || value === undefined) {
        return null;
    }
    return (_jsx("option", { value: value, children: Children.map(children, (child) => isValidElement(child) &&
            child.type === 'p'
            ? child.props.children
            : child) }));
}
/**
 * Default renderers for every custom element the inkstream remark plugins
 * emit. They carry stable `ink-*` class names and no visual opinions, so
 * consumers style them with plain CSS (or replace individual renderers via
 * the `components` prop of InkstreamMarkdown). The tag names are not part
 * of react-markdown's Components type, hence the cast at the end.
 */
export const inkstreamDefaultComponents = {
    box: ({ padding, children }) => (_jsx("div", { className: "ink-ui-box", style: padding && /^[0-8]$/.test(padding)
            ? { padding: `${Number(padding) * 0.25}rem` }
            : undefined, children: children })),
    row: ({ align, justify, gap, children }) => (_jsx("div", { className: "ink-ui-row", "data-align": align, "data-justify": justify, style: spacingStyle(gap), children: children })),
    column: ({ align, justify, gap, children }) => (_jsx("div", { className: "ink-ui-column", "data-align": align, "data-justify": justify, style: spacingStyle(gap), children: children })),
    icon: ({ name }) => name ? (_jsx("span", { className: "ink-ui-icon", children: _jsx(InkIcon, { name: name }) })) : null,
    button: GenerativeUiButton,
    form: GenerativeUiForm,
    input: GenerativeUiInput,
    slider: GenerativeUiSlider,
    checkbox: GenerativeUiCheckbox,
    select: GenerativeUiSelect,
    option: GenerativeUiOption,
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
    img: ({ src, alt, width: widthProp, height: heightProp, }) => {
        const { src: cleanSrc, width, height, caption, } = parseImageMetadata(src);
        // Dimensions from an HTML `<img width height>` arrive as props; the
        // Zenn `=250x` syntax arrives encoded in the URL and wins if both
        // are present.
        const image = (_jsx("img", { src: cleanSrc, alt: alt ?? '', width: width ?? widthProp, height: height ?? heightProp, className: "ink-image" }));
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