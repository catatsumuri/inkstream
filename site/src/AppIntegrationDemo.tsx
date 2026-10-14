import React, { useState } from 'react';
import {
    InkstreamMarkdown,
    type GenerativeUiEvent,
} from '@catatsumuri/inkstream/react';

const initialMarkdown = [
    '<Card title="レポート操作">',
    '<Slider id="threshold" label="検知閾値" min="0" max="100" step="5" default="65" />',
    '',
    '<Checkbox id="include-archived" label="過去の記録を含める" default="false" />',
    '',
    '<Select id="period" label="集計期間" default="week">',
    '<Option value="day">',
    '日単位',
    '</Option>',
    '',
    '<Option value="week">',
    '週単位',
    '</Option>',
    '</Select>',
    '',
    '<Button action="refresh-report">レポートを更新</Button>',
    '<Button action="delete-all">すべて削除</Button>',
    '</Card>',
].join('\n');

const applicationExample = `const allowedActions = {
  "refresh-report": () => refreshReport(),
};

function handleUiEvent(event) {
  if (event.type === "change" && event.id === "threshold") {
    setThreshold(event.value);
    return;
  }

  if (event.type === "change" && event.id === "include-archived") {
    setIncludeArchived(event.value);
    return;
  }

  if (event.type === "change" && event.id === "period") {
    setPeriod(event.value);
    return;
  }

  if (event.type === "action" && Object.hasOwn(allowedActions, event.action)) {
    allowedActions[event.action]();
  }
}`;

let nextEventId = 0;

interface EventRecord {
    id: number;
    event: GenerativeUiEvent;
    result: 'accepted' | 'rejected' | 'updated';
}

export default function AppIntegrationDemo() {
    const [markdown, setMarkdown] = useState(initialMarkdown);
    const [threshold, setThreshold] = useState(65);
    const [includeArchived, setIncludeArchived] = useState(false);
    const [period, setPeriod] = useState('week');
    const [refreshCount, setRefreshCount] = useState(0);
    const [events, setEvents] = useState<EventRecord[]>([]);

    function handleUiEvent(event: GenerativeUiEvent) {
        let result: EventRecord['result'] = 'rejected';

        if (event.type === 'change' && event.id === 'threshold') {
            if (typeof event.value === 'number') {
                setThreshold(event.value);
                result = 'updated';
            }
        } else if (
            event.type === 'change' &&
            event.id === 'include-archived'
        ) {
            if (typeof event.value === 'boolean') {
                setIncludeArchived(event.value);
                result = 'updated';
            }
        } else if (event.type === 'change' && event.id === 'period') {
            if (typeof event.value === 'string') {
                setPeriod(event.value);
                result = 'updated';
            }
        } else if (
            event.type === 'action' &&
            event.action === 'refresh-report'
        ) {
            setRefreshCount((count) => count + 1);
            result = 'accepted';
        }

        setEvents((current) =>
            [
                { id: ++nextEventId, event, result },
                ...current,
            ].slice(0, 8),
        );
    }

    return (
        <main className="app-demo-shell">
            <header className="app-demo-header">
                <a href="./" className="app-demo-brand">inkstream<span>.</span></a>
                <a href="./#integrate" className="app-demo-back">ドキュメントへ戻る ↗</a>
            </header>

            <section className="app-demo-intro">
                <p className="app-demo-kicker">GENERATIVE UI / APP BOUNDARY</p>
                <h1>状態と操作は、アプリ側で扱う。</h1>
                <p>
                    LLMが作ったMarkdownを貼り付けて、Inkstreamから届くイベントと、アプリが行う処理を試せます。
                </p>
            </section>

            <section className="app-demo-notice" aria-label="このデモについて">
                <strong>このページはブラウザー内だけで動きます。</strong>
                <span>
                    actionの許可リストをアプリ側で適用する例です。API通信やサーバー認可は行わず、サーバー側の安全性を証明するものではありません。
                </span>
            </section>

            <div className="app-demo-grid">
                <section className="app-demo-panel">
                    <label className="app-demo-panel-title" htmlFor="generated-markdown">
                        1. LLMの出力（Markdown + UIタグ）
                    </label>
                    <textarea
                        id="generated-markdown"
                        value={markdown}
                        onChange={(event) => setMarkdown(event.target.value)}
                        spellCheck={false}
                    />
                    <p className="app-demo-help">
                        OpenAI Responses APIなどの出力をここへ貼り付けられます。対応タグはButton、Slider、Checkbox、Select、Option、Cardです。
                    </p>
                </section>

                <section className="app-demo-panel">
                    <h2 className="app-demo-panel-title">2. Inkstreamの描画</h2>
                    <div className="app-demo-preview">
                        <InkstreamMarkdown
                            generativeUi
                            generativeUiValues={{
                                threshold,
                                'include-archived': includeArchived,
                                period,
                            }}
                            onGenerativeUiEvent={handleUiEvent}
                        >
                            {markdown}
                        </InkstreamMarkdown>
                    </div>
                </section>
            </div>

            <section className="app-demo-state">
                <div>
                    <p className="app-demo-kicker">APPLICATION STATE</p>
                    <h2>アプリが保持している値</h2>
                    <p>入力の変更イベントを受けて、React stateを更新しています。</p>
                </div>
                <output className="app-demo-value" aria-live="polite">閾値: {threshold}</output>
                <output className="app-demo-value" aria-live="polite">過去の記録: {includeArchived ? '含める' : '含めない'}</output>
                <output className="app-demo-value" aria-live="polite">集計期間: {period === 'day' ? '日単位' : '週単位'}</output>
                <output className="app-demo-value" aria-live="polite">更新処理: {refreshCount}回</output>
            </section>

            <section className="app-demo-panel app-demo-events">
                <div className="app-demo-events-heading">
                    <div>
                        <p className="app-demo-kicker">APP EVENT HANDLER</p>
                        <h2>アプリ側の許可リストとイベント</h2>
                    </div>
                    <button type="button" onClick={() => setEvents([])}>履歴を消去</button>
                </div>
                <pre><code>{applicationExample}</code></pre>
                {events.length === 0 ? (
                    <p className="app-demo-empty">スライダーかボタンを操作すると、アプリに届いたイベントを表示します。</p>
                ) : (
                    <ul className="app-demo-event-list" aria-live="polite">
                        {events.map(({ id, event, result }) => (
                            <li key={id}>
                                <code>{JSON.stringify(event)}</code>
                                <span className={`app-demo-result app-demo-result-${result}`}>
                                    {result === 'accepted'
                                        ? '許可リストで受け付け'
                                        : result === 'updated'
                                          ? 'アプリの値を更新'
                                          : '許可リスト外のため拒否'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
