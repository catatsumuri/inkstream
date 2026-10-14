import { useEffect, useState } from 'react';
import { InkstreamMarkdown } from '@catatsumuri/inkstream/react';
import { examples } from './examples.js';
import { translations, type Language } from './i18n.js';

const repositoryUrl = 'https://github.com/catatsumuri/inkstream';

const installCode = 'npm install @catatsumuri/inkstream';
const reactCode = `import { InkstreamMarkdown } from '@catatsumuri/inkstream/react';
import '@catatsumuri/inkstream/styles.css';

<InkstreamMarkdown>{markdownSource}</InkstreamMarkdown>;`;
const cliCode = `npx inkstream render README.md
npx inkstream text README.md
npx inkstream headings README.md --json`;
const integrationCode = `<InkstreamMarkdown
  headingIdPrefix="guide-"
  resolveWikilink={(path) => '/docs/' + path}
  ogpEndpoint="/api/ogp"
>
  {markdownSource}
</InkstreamMarkdown>`;
const aiReactCode = `const { markdown } = await fetch('/api/report-ui', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
}).then((response) => response.json());

<InkstreamMarkdown generativeUi>{markdown}</InkstreamMarkdown>`;
const aiServerCode = `const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL,
    instructions: [
      'Return Japanese Markdown. Allowed UI tags: Box, Row, Column, Icon, Card, Badge.',
      'Box padding is 0 to 8. Row and Column align is start, center, end, stretch, or baseline; justify is start, center, end, between, or around; gap is 0 to 8.',
      'Icon name must be a lowercase Lucide icon name. Use quoted string attributes only. No JSX expressions, JavaScript, or event handlers.',
    ].join(' '),
    input: prompt,
  }),
});
if (!response.ok) throw new Error('OpenAI request failed');
const data = await response.json();
const markdown = (data.output ?? [])
  .filter((item) => item.type === 'message')
  .flatMap((item) => item.content ?? [])
  .filter((part) => part.type === 'output_text')
  .map((part) => part.text)
  .join('\\n');`;
const aiServerReturnCode = 'return Response.json({ markdown });';

function initialLanguage(): Language {
    if (typeof window === 'undefined') return 'en';

    const requested = new URLSearchParams(window.location.search).get('lang');

    if (requested === 'en' || requested === 'ja') return requested;

    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

function CodeBlock({ code, label }: { code: string; label: string }) {
    return (
        <div className="site-code-block">
            <div className="site-code-label">{label}</div>
            <pre><code>{code}</code></pre>
        </div>
    );
}

export default function App() {
    const [language, setLanguage] = useState<Language>(initialLanguage);
    const [selectedId, setSelectedId] = useState(examples[0].id);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const t = translations[language];
    const syntaxUrl = `${repositoryUrl}/blob/main/docs/syntax${language === 'ja' ? '.ja' : ''}.md`;
    const selectedExample = examples.find((example) => example.id === selectedId) ?? examples[0];
    const selectedText = selectedExample.text[language];
    const draftKey = `${language}:${selectedId}`;
    const source = drafts[draftKey] ?? selectedExample.source[language];

    useEffect(() => {
        document.documentElement.lang = language;
        document.title = t.pageTitle;
        document.querySelector('meta[name="description"]')?.setAttribute('content', t.pageDescription);

        const url = new URL(window.location.href);
        url.searchParams.set('lang', language);
        window.history.replaceState(null, '', url);
    }, [language, t.pageDescription, t.pageTitle]);

    function changeLanguage(next: Language) {
        setLanguage(next);
        setCopyStatus('idle');
    }

    function selectExample(id: string) {
        setSelectedId(id);
        setCopyStatus('idle');
    }

    async function copySource() {
        try {
            await navigator.clipboard.writeText(source);
            setCopyStatus('copied');
            window.setTimeout(() => setCopyStatus('idle'), 2000);
        } catch {
            setCopyStatus('failed');
        }
    }

    return (
        <>
            <header className="site-header">
                <div className="site-shell header-inner">
                    <a className="brand" href="#top" aria-label={t.homeLabel}>
                        <span className="brand-mark" aria-hidden="true"><span /></span>
                        <span>inkstream<span className="brand-dot">.</span></span>
                    </a>
                    <nav className="site-nav" aria-label={t.mainNavigation}>
                        <a href="#start">{t.getStarted}</a>
                        <a href="#examples">{t.examples}</a>
                        <a href="#integrate">{t.integrate}</a>
                        <a href={syntaxUrl} target="_blank" rel="noreferrer">{t.syntaxReference} ↗</a>
                    </nav>
                    <div className="language-switch" role="group" aria-label={t.languageLabel}>
                        <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => changeLanguage('en')}>EN</button>
                        <button type="button" lang="ja" aria-pressed={language === 'ja'} onClick={() => changeLanguage('ja')}>日本語</button>
                    </div>
                    <a className="header-github" href={repositoryUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
                </div>
            </header>

            <main id="top">
                <section className="hero site-shell">
                    <div className="hero-copy">
                        <h1>{t.heroFirst}<br /><em>{t.heroSecond}</em></h1>
                        <p className="hero-lede">{t.heroLede}</p>
                        <div className="hero-actions">
                            <a className="button button-primary" href="#examples">{t.exploreExamples} <span aria-hidden="true">↗</span></a>
                            <a className="button button-outline" href="#start">{t.getStarted} <span aria-hidden="true">→</span></a>
                        </div>
                        <div className="hero-meta"><span className="meta-indicator" /> {t.heroMeta}</div>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                        <div className="art-orbit art-orbit-one" />
                        <div className="art-orbit art-orbit-two" />
                        <div className="art-card art-card-back"><span className="art-label">SOURCE / .md</span><span className="art-line art-line-wide" /><span className="art-line" /><span className="art-line art-line-short" /><span className="art-tag">&lt;Note&gt;</span></div>
                        <div className="art-card art-card-front"><span className="art-label">OUTPUT / HTML</span><span className="art-callout-dot" /><span className="art-line art-line-wide" /><span className="art-line" /><span className="art-line art-line-short" /></div>
                        <div className="art-star art-star-one">✳</div><div className="art-star art-star-two">✳</div>
                    </div>
                </section>

                <section className="feature-strip" aria-label={t.highlights}>
                    <div className="site-shell feature-grid">
                        <div><span className="feature-number">01 /</span><strong>{t.featureOneTitle}</strong><span>{t.featureOneDetail}</span></div>
                        <div><span className="feature-number">02 /</span><strong>{t.featureTwoTitle}</strong><span>{t.featureTwoDetail}</span></div>
                        <div><span className="feature-number">03 /</span><strong>{t.featureThreeTitle}</strong><span>{t.featureThreeDetail}</span></div>
                    </div>
                </section>

                <section id="start" className="section site-shell start-section">
                    <div className="section-heading"><div><p className="section-kicker">{t.startKicker}</p><h2>{t.startTitle}</h2></div><p>{t.startIntro}</p></div>
                    <div className="start-grid">
                        <div className="start-install"><span className="small-label">{t.installLabel}</span><CodeBlock label="terminal" code={installCode} /><p>{t.installNote}</p></div>
                        <div className="start-react"><span className="small-label">REACT</span><CodeBlock label="example.tsx" code={reactCode} /><p>{t.reactNote}</p></div>
                    </div>
                </section>

                <section id="examples" className="section examples-section">
                    <div className="site-shell">
                        <div className="section-heading examples-heading"><div><p className="section-kicker">{t.examplesKicker}</p><h2>{t.examplesTitle}</h2></div><p>{t.examplesIntro}</p></div>
                        <div className="playground">
                            <div className="example-sidebar" aria-label={t.exampleNavigation}>
                                <span className="small-label">{t.exampleLibrary}</span>
                                <div className="example-list">
                                    {examples.map((example, index) => (
                                        <button
                                            key={example.id}
                                            type="button"
                                            className={`example-choice${selectedId === example.id ? ' is-active' : ''}`}
                                            aria-pressed={selectedId === example.id}
                                            onClick={() => selectExample(example.id)}
                                        >
                                            <span className="example-index">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="example-title">{example.text[language].title}</span>
                                            <span className="choice-arrow">↗</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="sidebar-foot">{t.sidebarFoot}</div>
                            </div>
                            <div className="workbench">
                                <div className="workbench-head"><div><span className="workbench-category">{selectedText.category}</span><h3>{selectedText.title}</h3><p>{selectedText.description}</p></div><button type="button" className="copy-button" onClick={copySource}>{t.copy[copyStatus]}</button></div>
                                <div className="workbench-panes">
                                    <div className="pane pane-source"><div className="pane-heading"><span className="pane-dot source-dot" /> MARKDOWN <span className="pane-hint">{t.editMe}</span></div><label className="visually-hidden" htmlFor="markdown-source">{t.markdownSource}</label><textarea id="markdown-source" value={source} onChange={(event) => setDrafts((current) => ({ ...current, [draftKey]: event.target.value }))} spellCheck={false} /></div>
                        <div className="pane pane-preview"><div className="pane-heading"><span className="pane-dot preview-dot" /> {t.livePreview} <span className="pane-hint">INKSTREAM</span></div><div className="preview-content"><InkstreamMarkdown generativeUi={selectedExample.generativeUi}>{source}</InkstreamMarkdown></div></div>
                                </div>
                            </div>
                        </div>
                        <p className="examples-note">{t.examplesNoteStart}{language === 'en' ? ' ' : ''}<a href={syntaxUrl} target="_blank" rel="noreferrer">{t.examplesNoteLink} ↗</a>{language === 'en' ? ' ' : ''}{t.examplesNoteEnd}</p>
                    </div>
                </section>

                <section id="integrate" className="section site-shell integrate-section">
                    <div className="section-heading"><div><p className="section-kicker">{t.integrateKicker}</p><h2>{t.integrateTitle}</h2></div><p>{t.integrateIntro}</p></div>
                    <div className="integration-grid">
                        <div className="integration-card"><span className="card-glyph">↗</span><h3>{t.connectTitle}</h3><p>{t.connectIntro}</p><CodeBlock label="example.tsx" code={integrationCode} /><p className="card-footnote">{t.connectNote}</p></div>
                        <div className="integration-card"><span className="card-glyph">&gt;_</span><h3>{t.cliTitle}</h3><p>{t.cliIntro}</p><CodeBlock label="terminal" code={cliCode} /><p className="card-footnote">{t.cliNote}</p></div>
                        <div className="integration-card ai-integration-card"><span className="card-glyph">✳</span><h3>{t.aiTitle}</h3><p>{t.aiIntro}</p><div className="ai-code-grid"><div><CodeBlock label="api-route.ts — server" code={`${aiServerCode}\n${aiServerReturnCode}`} /></div><div><CodeBlock label="React — client" code={aiReactCode} /></div></div><p className="card-footnote">{t.aiNote} <a href="https://developers.openai.com/api/docs/guides/text" target="_blank" rel="noreferrer">{t.aiDocs} ↗</a></p></div>
                    </div>
                </section>
            </main>

            <footer className="site-footer"><div className="site-shell footer-inner"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><span /></span><span>inkstream<span className="brand-dot">.</span></span></a><span>{t.footerTagline}</span><div><a href={`${repositoryUrl}/blob/main/README.md`} target="_blank" rel="noreferrer">README ↗</a><a href={syntaxUrl} target="_blank" rel="noreferrer">{t.footerSyntax} ↗</a><a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub ↗</a></div></div></footer>
        </>
    );
}
