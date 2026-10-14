export type GenerativeUiValue = string | number | boolean;
export type GenerativeUiEvent = {
    type: 'submit';
    id: string;
    action: string;
    values: Readonly<Record<string, GenerativeUiValue>>;
} | {
    type: 'action';
    action: string;
} | {
    type: 'change';
    id: string;
    value: GenerativeUiValue;
};
export interface GenerativeUiContextValue {
    values?: Readonly<Record<string, GenerativeUiValue>>;
    onEvent?: (event: GenerativeUiEvent) => void;
}
export declare const GenerativeUiContext: import("react").Context<GenerativeUiContextValue>;
export declare function useGenerativeUiContext(): GenerativeUiContextValue;
//# sourceMappingURL=generative-ui-context.d.ts.map