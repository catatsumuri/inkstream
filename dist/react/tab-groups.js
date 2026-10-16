import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, createContext, isValidElement, useContext, useEffect, useId, useState, } from 'react';
import { parseCodeMeta } from './code-block.js';
const TabSyncContext = createContext(null);
const InsideTabsContext = createContext(false);
/** Selection is scoped to one Markdown document, including its nested groups. */
export function TabSyncProvider({ children }) {
    const [selection, select] = useState(null);
    return _jsx(TabSyncContext.Provider, { value: { selection, select }, children: children });
}
function tagName(child) {
    if (!isValidElement(child))
        return undefined;
    return child.props.node?.tagName ?? (typeof child.type === 'string' ? child.type : undefined);
}
function codeTitle(child, index) {
    const code = Children.toArray(child.props.children).find(node => tagName(node) === 'code');
    if (!isValidElement(code))
        return `Code ${index + 1}`;
    const meta = code.props.metastring ?? String(code.props.node?.properties.metastring ?? '');
    const parsed = parseCodeMeta(code.props.className, meta);
    const explicit = /(?:^|\s)(?:title|tab)="([^"]+)"/.exec(meta)?.[1];
    const bare = meta && !/[={}]/.test(meta) && !/^(?:expandable|wrap|lines)(?:\s|$)/.test(meta)
        ? meta : null;
    return explicit ?? parsed.filename ?? (parsed.isDiff ? null : bare) ?? (parsed.language || `Code ${index + 1}`);
}
export function TabGroup({ children, sync, kind = 'tabs' }) {
    const id = useId();
    const shared = useContext(TabSyncContext);
    const [selected, setSelected] = useState(0);
    const nodes = Children.toArray(children);
    const expectedTag = kind === 'tabs' ? 'tab' : 'pre';
    const entries = nodes.filter(child => tagName(child) === expectedTag);
    const titles = entries.map((child, index) => kind === 'tabs'
        ? (child.props.title || `Tab ${index + 1}`) : codeTitle(child, index));
    const looseContent = nodes.filter(child => tagName(child) !== expectedTag);
    const synced = sync !== 'false' && shared?.selection && shared.selection.source !== id
        ? titles.indexOf(shared.selection.title) : -1;
    useEffect(() => { if (synced >= 0)
        setSelected(synced); }, [synced]);
    const active = synced >= 0 ? synced : Math.min(selected, Math.max(entries.length - 1, 0));
    const select = (index) => {
        setSelected(index);
        if (sync !== 'false')
            shared?.select({ title: titles[index], source: id });
    };
    const onKeyDown = (event, index) => {
        let next;
        switch (event.key) {
            case 'ArrowRight':
                next = (index + 1) % entries.length;
                break;
            case 'ArrowLeft':
                next = (index - 1 + entries.length) % entries.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = entries.length - 1;
                break;
            default: return;
        }
        event.preventDefault();
        select(next);
        const buttons = event.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
        buttons?.[next]?.focus();
    };
    const className = kind === 'tabs' ? 'ink-tabs' : 'ink-code-group';
    return (_jsxs("div", { className: className, children: [entries.length > 0 && _jsxs(_Fragment, { children: [_jsx("div", { role: "tablist", "aria-label": kind === 'tabs' ? 'Content options' : 'Code examples', className: "ink-tab-list", children: entries.map((child, index) => (_jsx("button", { type: "button", role: "tab", id: `${id}-tab-${index}`, "aria-controls": `${id}-panel-${index}`, "aria-selected": index === active, tabIndex: index === active ? 0 : -1, className: "ink-tab-button ink-tab-title", onClick: () => select(index), onKeyDown: event => onKeyDown(event, index), children: titles[index] }, child.key ?? index))) }), entries.map((child, index) => (_jsx("div", { role: "tabpanel", id: `${id}-panel-${index}`, "aria-labelledby": `${id}-tab-${index}`, hidden: index !== active, tabIndex: 0, className: kind === 'tabs' ? 'ink-tab ink-tab-panel' : 'ink-tab-panel', children: _jsx(InsideTabsContext.Provider, { value: kind === 'tabs', children: child }) }, child.key ?? index)))] }), looseContent] }));
}
export function TabPanel({ title, children }) {
    const inside = useContext(InsideTabsContext);
    return inside ? _jsx("div", { className: "ink-tab-body", children: children }) : (_jsxs("section", { className: "ink-tab", children: [title && _jsx("p", { className: "ink-tab-title", children: title }), children] }));
}
//# sourceMappingURL=tab-groups.js.map