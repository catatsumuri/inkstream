import Markdown from 'react-markdown';

/** Captions accept inline Markdown without HTML, images or Inkstream controls. */
export function InlineCaption({ children }: { children: string }) {
    return (
        <Markdown
            allowedElements={['p', 'a', 'strong', 'em', 'code', 'br']}
            unwrapDisallowed
            skipHtml
            components={{ p: ({ children }) => <>{children}</> }}
        >
            {children}
        </Markdown>
    );
}
