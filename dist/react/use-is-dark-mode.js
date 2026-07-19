import { useEffect, useState } from 'react';
/**
 * Tracks whether the `dark` class is present on the document root, for
 * renderers whose colors are passed as props or config rather than CSS
 * (recharts, mermaid) and thus can't follow the `ink-*` stylesheet alone.
 */
export function useIsDarkMode() {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const update = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        update();
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);
    return isDark;
}
//# sourceMappingURL=use-is-dark-mode.js.map