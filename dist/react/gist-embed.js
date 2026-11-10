import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
/** Read public Gist data without injecting provider scripts into the document. */
export function GistEmbed({ url }) {
    const [files, setFiles] = useState([]);
    useEffect(() => {
        setFiles([]);
        if (!url)
            return;
        const parsed = new URL(url);
        const id = parsed.pathname.split('/').filter(Boolean).at(-1);
        const controller = new AbortController();
        fetch(`https://api.github.com/gists/${id}`, {
            signal: controller.signal,
        })
            .then((response) => {
            if (!response.ok)
                throw new Error('Gist unavailable');
            return response.json();
        })
            .then((data) => {
            const name = parsed.searchParams.get('file');
            setFiles(Object.values(data.files).filter((file) => !name || file.filename === name));
        })
            .catch(() => { });
        return () => controller.abort();
    }, [url]);
    return (_jsxs("div", { className: "ink-gist-embed", children: [files.map((file) => (_jsxs("div", { children: [_jsx("p", { children: file.filename }), _jsx("pre", { children: _jsx("code", { children: file.content }) })] }, file.filename))), _jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", children: url })] }));
}
//# sourceMappingURL=gist-embed.js.map