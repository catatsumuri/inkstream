import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InlineCaption } from './inline-caption.js';
/** Captions accept inline Markdown, without nested interactive Inkstream tags. */
export function MediaFrame({ caption, hint, children }) {
    return (_jsxs("div", { className: "ink-frame-group", children: [hint && _jsx("p", { className: "ink-frame-hint", children: hint }), _jsxs("figure", { className: "ink-frame", children: [_jsx("div", { className: "ink-frame-content", children: children }), caption && (_jsx("figcaption", { className: "ink-frame-caption", children: _jsx(InlineCaption, { children: caption }) }))] })] }));
}
//# sourceMappingURL=media-frame.js.map