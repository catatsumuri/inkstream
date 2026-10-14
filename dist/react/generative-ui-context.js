import { createContext, useContext } from 'react';
export const GenerativeUiContext = createContext({});
export function useGenerativeUiContext() {
    return useContext(GenerativeUiContext);
}
//# sourceMappingURL=generative-ui-context.js.map