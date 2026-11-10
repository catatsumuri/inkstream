import { useEffect, useState } from 'react';

interface GistFile {
    filename: string;
    content?: string;
    truncated?: boolean;
}

/** Read public Gist data without injecting provider scripts into the document. */
export function GistEmbed({ url }: { url?: string }) {
    const [files, setFiles] = useState<GistFile[]>([]);
    useEffect(() => {
        setFiles([]);
        if (!url) return;
        const parsed = new URL(url);
        const id = parsed.pathname.split('/').filter(Boolean).at(-1)!;
        const controller = new AbortController();
        fetch(`https://api.github.com/gists/${id}`, {
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error('Gist unavailable');
                return response.json();
            })
            .then((data: { files: Record<string, GistFile> }) => {
                const name = parsed.searchParams.get('file');
                setFiles(
                    Object.values(data.files).filter(
                        (file) => !name || file.filename === name,
                    ),
                );
            })
            .catch(() => {});
        return () => controller.abort();
    }, [url]);
    return (
        <div className="ink-gist-embed">
            {files.map((file) => (
                <div key={file.filename}>
                    <p>{file.filename}</p>
                    <pre>
                        <code>{file.content}</code>
                    </pre>
                </div>
            ))}
            <a href={url} target="_blank" rel="noopener noreferrer">
                {url}
            </a>
        </div>
    );
}
