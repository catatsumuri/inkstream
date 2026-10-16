import { type ReactNode } from 'react';
/** Each document and each panel owns a synchronization scope. */
export declare function TabSyncProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function TabGroup({ children, sync, kind }: {
    children?: ReactNode;
    sync?: string;
    kind?: 'tabs' | 'codegroup';
}): import("react").JSX.Element;
export declare function TabPanel({ title, children }: {
    title?: string;
    children?: ReactNode;
}): import("react").JSX.Element;
//# sourceMappingURL=tab-groups.d.ts.map