import { InlineCaption } from './inline-caption.js';
import type { InkstreamElementProps } from './default-components.js';

/** Captions accept inline Markdown, without nested interactive Inkstream tags. */
export function MediaFrame({ caption, hint, children }: InkstreamElementProps) {
    return (
        <div className="ink-frame-group">
            {hint && <p className="ink-frame-hint">{hint}</p>}
            <figure className="ink-frame">
                <div className="ink-frame-content">{children}</div>
                {caption && (
                    <figcaption className="ink-frame-caption">
                        <InlineCaption>{caption}</InlineCaption>
                    </figcaption>
                )}
            </figure>
        </div>
    );
}
