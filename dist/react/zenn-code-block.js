import { jsx as _jsx } from "react/jsx-runtime";
import { CodeBlock } from './code-block.js';
/** Match the diagram limits documented by Zenn before loading Mermaid. */
export function ZennCodeBlock(props) {
    if (props.className === 'language-mermaid') {
        const source = String(props.children ?? '').replace(/\n$/, '');
        if (source.length > 2000 || (source.match(/&/g)?.length ?? 0) > 10) {
            return (_jsx("div", { className: "ink-mermaid-error", role: "alert", children: "Mermaid diagrams support up to 2,000 characters and 10 chain operators." }));
        }
    }
    return _jsx(CodeBlock, { ...props });
}
//# sourceMappingURL=zenn-code-block.js.map