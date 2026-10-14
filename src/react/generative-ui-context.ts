import { createContext, useContext } from 'react';

export type GenerativeUiValue = string | number | boolean;

export type GenerativeUiEvent =
    | {
          type: 'submit';
          id: string;
          action: string;
          values: Readonly<Record<string, GenerativeUiValue>>;
      }
    | { type: 'action'; action: string }
    | { type: 'change'; id: string; value: GenerativeUiValue };

export interface GenerativeUiContextValue {
    streaming?: boolean;
    values?: Readonly<Record<string, GenerativeUiValue>>;
    onEvent?: (event: GenerativeUiEvent) => void;
}

export const GenerativeUiContext =
    createContext<GenerativeUiContextValue>({});

export function useGenerativeUiContext(): GenerativeUiContextValue {
    return useContext(GenerativeUiContext);
}
