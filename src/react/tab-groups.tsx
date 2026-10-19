import {
    Children, cloneElement, Fragment, createContext, isValidElement, useContext, useEffect, useId, useState,
    type ReactNode, type ReactElement, type KeyboardEvent,
} from 'react';
import type { Element } from 'hast';
import { parseCodeOptions } from '../code-options.js';
import { parseCodeMeta } from './code-block.js';

interface SyncSelection { title: string; source: string }
const TabSyncContext = createContext<{
    selection: SyncSelection | null;
    select: (selection: SyncSelection) => void;
} | null>(null);
const InsideTabsContext = createContext(false);

/** Each document and each panel owns a synchronization scope. */
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
    const explicit = parseCodeOptions(meta).title ?? /(?:^|\s)tab="([^"]+)"/.exec(meta)?.[1];
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
    const [selected, setSelected] = useState<string | null>(null);
    const nodes = Children.toArray(children);
    const expectedTag = kind === 'tabs' ? 'tab' : 'pre';
    const occurrences = new Map<string, number>();
    const entries = nodes.filter(child => tagName(child) === expectedTag)
        .map((node, index) => {
            const child = node as ReactElement<ChildProps>;
            const title = kind === 'tabs'
                ? (child.props.title || `Tab ${index + 1}`) : codeTitle(child, index);
            const occurrence = occurrences.get(title) ?? 0;
            occurrences.set(title, occurrence + 1);
            return { child, title, key: JSON.stringify([title, occurrence]) };
        });
    const synced = sync !== 'false' && shared?.selection && shared.selection.source !== id
        ? entries.findIndex(entry => entry.title === shared.selection!.title) : -1;
    const retained = entries.findIndex(entry => entry.key === selected);
    const active = synced >= 0 ? synced : retained >= 0 ? retained : 0;
    const activeKey = entries[active]?.key ?? null;
    // Remember synchronized choices, and discard identities that were removed.
    useEffect(() => { setSelected(activeKey); }, [activeKey]);
    const select = (index: number) => {
        const entry = entries[index];
        setSelected(entry.key);
        if (sync !== 'false') shared?.select({ title: entry.title, source: id });
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
    const tabList = (
        <div role="tablist" aria-label={kind === 'tabs' ? 'Content options' : 'Code examples'} className="ink-tab-list">
            {entries.map((entry, index) => (
                <button key={entry.key} type="button" role="tab"
                    id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
                    aria-selected={index === active} tabIndex={index === active ? 0 : -1}
                    className="ink-tab-button ink-tab-title" onClick={() => select(index)}
                    onKeyDown={event => onKeyDown(event, index)}>
                    {entry.title}
                </button>
            ))}
        </div>
    );
    let entryIndex = 0;
    return (
        <div className={className}>
            {nodes.map(child => {
                if (tagName(child) !== expectedTag) return child;
                const index = entryIndex++;
                const entry = entries[index];
                return (
                    <Fragment key={entry.key}>
                        {index === 0 && tabList}
                        <div key="panel" role="tabpanel" id={`${id}-panel-${index}`}
                            aria-labelledby={`${id}-tab-${index}`} hidden={index !== active} tabIndex={0}
                            className={kind === 'tabs' ? 'ink-tab ink-tab-panel' : 'ink-tab-panel'}>
                            <TabSyncProvider>
                                <InsideTabsContext.Provider value={kind === 'tabs'}>
                                    {cloneElement(entry.child, { key: entry.key })}
                                </InsideTabsContext.Provider>
                            </TabSyncProvider>
                        </div>
                    </Fragment>
                );
            })}
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
