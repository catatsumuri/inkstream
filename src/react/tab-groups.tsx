import {
    Children, createContext, isValidElement, useContext, useEffect, useId, useState,
    type ReactNode, type ReactElement, type KeyboardEvent,
} from 'react';
import type { Element } from 'hast';
import { parseCodeMeta } from './code-block.js';

interface SyncSelection { title: string; source: string }
const TabSyncContext = createContext<{
    selection: SyncSelection | null;
    select: (selection: SyncSelection) => void;
} | null>(null);
const InsideTabsContext = createContext(false);

/** Selection is scoped to one Markdown document, including its nested groups. */
export function TabSyncProvider({ children }: { children: ReactNode }) {
    const [selection, select] = useState<SyncSelection | null>(null);
    return <TabSyncContext.Provider value={{ selection, select }}>{children}</TabSyncContext.Provider>;
}

type ChildProps = { children?: ReactNode; title?: string; node?: Element; className?: string; metastring?: string };
function tagName(child: ReactNode): string | undefined {
    if (!isValidElement<ChildProps>(child)) return undefined;
    return child.props.node?.tagName ?? (typeof child.type === 'string' ? child.type : undefined);
}

function codeTitle(child: ReactElement<ChildProps>, index: number): string {
    const code = Children.toArray(child.props.children).find(node => tagName(node) === 'code');
    if (!isValidElement<ChildProps>(code)) return `Code ${index + 1}`;
    const meta = code.props.metastring ?? String(code.props.node?.properties.metastring ?? '');
    const parsed = parseCodeMeta(code.props.className, meta);
    const explicit = /(?:^|\s)(?:title|tab)="([^"]+)"/.exec(meta)?.[1];
    const bare = meta && !/[={}]/.test(meta) && !/^(?:expandable|wrap|lines)(?:\s|$)/.test(meta)
        ? meta : null;
    return explicit ?? parsed.filename ?? (parsed.isDiff ? null : bare) ?? (parsed.language || `Code ${index + 1}`);
}

export function TabGroup({ children, sync, kind = 'tabs' }: {
    children?: ReactNode;
    sync?: string;
    kind?: 'tabs' | 'codegroup';
}) {
    const id = useId();
    const shared = useContext(TabSyncContext);
    const [selected, setSelected] = useState(0);
    const nodes = Children.toArray(children);
    const expectedTag = kind === 'tabs' ? 'tab' : 'pre';
    const entries = nodes.filter(child => tagName(child) === expectedTag) as ReactElement<ChildProps>[];
    const titles = entries.map((child, index) => kind === 'tabs'
        ? (child.props.title || `Tab ${index + 1}`) : codeTitle(child, index));
    const looseContent = nodes.filter(child => tagName(child) !== expectedTag);
    const synced = sync !== 'false' && shared?.selection && shared.selection.source !== id
        ? titles.indexOf(shared.selection.title) : -1;
    useEffect(() => { if (synced >= 0) setSelected(synced); }, [synced]);
    const active = synced >= 0 ? synced : Math.min(selected, Math.max(entries.length - 1, 0));
    const select = (index: number) => {
        setSelected(index);
        if (sync !== 'false') shared?.select({ title: titles[index], source: id });
    };
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next: number;
        switch (event.key) {
            case 'ArrowRight': next = (index + 1) % entries.length; break;
            case 'ArrowLeft': next = (index - 1 + entries.length) % entries.length; break;
            case 'Home': next = 0; break;
            case 'End': next = entries.length - 1; break;
            default: return;
        }
        event.preventDefault();
        select(next);
        const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[next]?.focus();
    };
    const className = kind === 'tabs' ? 'ink-tabs' : 'ink-code-group';
    return (
        <div className={className}>
            {entries.length > 0 && <>
                <div role="tablist" aria-label={kind === 'tabs' ? 'Content options' : 'Code examples'} className="ink-tab-list">
                    {entries.map((child, index) => (
                        <button key={child.key ?? index} type="button" role="tab"
                            id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
                            aria-selected={index === active} tabIndex={index === active ? 0 : -1}
                            className="ink-tab-button ink-tab-title" onClick={() => select(index)}
                            onKeyDown={event => onKeyDown(event, index)}>
                            {titles[index]}
                        </button>
                    ))}
                </div>
                {entries.map((child, index) => (
                    <div key={child.key ?? index} role="tabpanel" id={`${id}-panel-${index}`}
                        aria-labelledby={`${id}-tab-${index}`} hidden={index !== active} tabIndex={0}
                        className={kind === 'tabs' ? 'ink-tab ink-tab-panel' : 'ink-tab-panel'}>
                        <InsideTabsContext.Provider value={kind === 'tabs'}>{child}</InsideTabsContext.Provider>
                    </div>
                ))}
            </>}
            {looseContent}
        </div>
    );
}

export function TabPanel({ title, children }: { title?: string; children?: ReactNode }) {
    const inside = useContext(InsideTabsContext);
    return inside ? <div className="ink-tab-body">{children}</div> : (
        <section className="ink-tab">
            {title && <p className="ink-tab-title">{title}</p>}
            {children}
        </section>
    );
}
