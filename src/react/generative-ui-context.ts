import { createContext, useContext } from 'react';

export type GenerativeUiEvent =
    | { type: 'action'; action: string }
    | { type: 'change'; id: string; value: number };

export type GenerativeUiValue = string | number | boolean;

export interface GenerativeUiContextValue {
    values?: Readonly<Record<string, GenerativeUiValue>>;
    onEvent?: (event: GenerativeUiEvent) => void;
}

export const GenerativeUiContext =
    createContext<GenerativeUiContextValue>({});

export function useGenerativeUiContext(): GenerativeUiContextValue {
    return useContext(GenerativeUiContext);
}
