import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import Markdown from 'react-markdown';
/** Captions accept inline Markdown without HTML, images or Inkstream controls. */
export function InlineCaption({ children }) {
    return (_jsx(Markdown, { allowedElements: ['p', 'a', 'strong', 'em', 'code', 'br'], unwrapDisallowed: true, skipHtml: true, components: { p: ({ children }) => _jsx(_Fragment, { children: children }) }, children: children }));
}
//# sourceMappingURL=inline-caption.js.map