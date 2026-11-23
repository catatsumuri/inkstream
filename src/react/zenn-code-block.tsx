import type { ComponentProps } from 'react';
import { CodeBlock } from './code-block.js';

/** Match the diagram limits documented by Zenn before loading Mermaid. */
export function ZennCodeBlock(props: ComponentProps<typeof CodeBlock>) {
    if (props.className === 'language-mermaid') {
        const source = String(props.children ?? '').replace(/\n$/, '');
        if (source.length > 2000 || (source.match(/&/g)?.length ?? 0) > 10) {
            return (
                <div className="ink-mermaid-error" role="alert">
                    Mermaid diagrams support up to 2,000 characters and 10 chain
                    operators.
                </div>
            );
        }
    }
    return <CodeBlock {...props} />;
}
