import type { SyntaxProfile } from '@catatsumuri/inkstream/react';
import basicEn from '../examples/basic.md?raw';
import basicJa from '../examples/ja/basic.md?raw';
import htmlEmbedEn from '../examples/html-embed.md?raw';
import htmlEmbedJa from '../examples/ja/html-embed.md?raw';
import type { Language } from './i18n.js';
import calloutsEn from '../examples/callouts.md?raw';
import cardsEn from '../examples/cards.md?raw';
import stepsEn from '../examples/steps.md?raw';
import inlineEn from '../examples/inline.md?raw';
import zennEn from '../examples/zenn.md?raw';
import fencesEn from '../examples/fences.md?raw';
import headingsEn from '../examples/headings.md?raw';
import codeEn from '../examples/code.md?raw';
import generativeUiEn from '../examples/generative-ui.md?raw';
import calloutsJa from '../examples/ja/callouts.md?raw';
import cardsJa from '../examples/ja/cards.md?raw';
import stepsJa from '../examples/ja/steps.md?raw';
import inlineJa from '../examples/ja/inline.md?raw';
import zennJa from '../examples/ja/zenn.md?raw';
import fencesJa from '../examples/ja/fences.md?raw';
import headingsJa from '../examples/ja/headings.md?raw';
import codeJa from '../examples/ja/code.md?raw';
import generativeUiJa from '../examples/ja/generative-ui.md?raw';

interface ExampleText {
    title: string;
    category: string;
    description: string;
}

export interface Example {
    id: string;
    generativeUi?: boolean;
    syntax?: SyntaxProfile;
    text: Record<Language, ExampleText>;
    source: Record<Language, string>;
}

export const examples: Example[] = [
    {
        id: 'basic',
        syntax: 'basic',
        text: {
            en: { title: 'Basic Markdown', category: 'Syntax', description: 'CommonMark without GFM or component extensions. Switch profiles to compare the same source.' },
            ja: { title: '基本の Markdown', category: '構文', description: 'GFM やコンポーネント拡張のない CommonMark。同じソースでプロファイルの違いを比較できます。' },
        },
        source: { en: basicEn, ja: basicJa },
    },
    {
        id: 'html-embed',
        text: {
            en: { title: 'HTML embed', category: 'Diagrams', description: 'HTML, CSS, and SVG in an isolated iframe. No scripts or navigation; maximum 50 KiB.' },
            ja: { title: 'HTML embed', category: '図と埋め込み', description: 'HTML・CSS・SVG を隔離した iframe で表示。スクリプトと画面遷移は無効、上限は 50 KiB です。' },
        },
        source: { en: htmlEmbedEn, ja: htmlEmbedJa },
    },
    {
        id: 'callouts',
        text: {
            en: { title: 'Callouts', category: 'Components', description: 'Mintlify-style tags, Zenn directives, and GitHub alerts.' },
            ja: { title: 'コールアウト', category: 'コンポーネント', description: 'Mintlify 風タグ、Zenn ディレクティブ、GitHub アラート。' },
        },
        source: { en: calloutsEn, ja: calloutsJa },
    },
    {
        id: 'cards',
        text: {
            en: { title: 'Cards & frames', category: 'Components', description: 'Responsive cards and bordered frames with captions and hints.' },
            ja: { title: 'カードと Frame', category: 'コンポーネント', description: 'カードの配置と、キャプション・ヒント付きの枠を試します。' },
        },
        source: { en: cardsEn, ja: cardsJa },
    },
    {
        id: 'steps',
        text: {
            en: { title: 'Steps', category: 'Components', description: 'Turn a sequence of actions into a clear visual flow.' },
            ja: { title: '手順', category: 'コンポーネント', description: '作業の流れを順序付きでわかりやすく示します。' },
        },
        source: { en: stepsEn, ja: stepsJa },
    },
    {
        id: 'inline',
        text: {
            en: { title: 'Inline & disclosure', category: 'Components', description: 'Badges, tooltips, and expandable sections.' },
            ja: { title: 'インラインと折りたたみ', category: 'コンポーネント', description: 'バッジ、ツールチップ、折りたたみ表示。' },
        },
        source: { en: inlineEn, ja: inlineJa },
    },
    {
        id: 'zenn',
        syntax: 'zenn',
        text: {
            en: { title: 'Zenn profile', category: 'Syntax', description: 'Zenn messages, footnotes, tables, math, and line breaks without Mintlify components.' },
            ja: { title: 'Zenn プロファイル', category: '構文', description: 'Mintlify のコンポーネントを使わず、メッセージ・脚注・表・数式・改行を表示します。' },
        },
        source: { en: zennEn, ja: zennJa },
    },
    {
        id: 'fences',
        text: {
            en: { title: 'Tree & quiz', category: 'Fences', description: 'Structured content from ordinary code fences.' },
            ja: { title: 'ツリーとクイズ', category: 'コードフェンス', description: 'コードフェンスから構造化された内容を表示します。' },
        },
        source: { en: fencesEn, ja: fencesJa },
    },
    {
        id: 'headings',
        text: {
            en: { title: 'Headings & GFM', category: 'Markdown', description: 'Anchors, tables, and familiar GitHub Markdown.' },
            ja: { title: '見出しと GFM', category: 'Markdown', description: 'アンカー、表など、GitHub でおなじみの構文。' },
        },
        source: { en: headingsEn, ja: headingsJa },
    },
    {
        id: 'generative-ui',
        generativeUi: true,
        text: {
            en: { title: 'Generative UI', category: 'Generative UI', description: 'Opt-in layouts, inputs, and forms. Connect events in the application integration demo.' },
            ja: { title: 'Generative UI', category: 'Generative UI', description: '明示的に有効にするレイアウト・入力・フォーム。イベント処理はアプリ連携デモで確認できます。' },
        },
        source: { en: generativeUiEn, ja: generativeUiJa },
    },
    {
        id: 'code',
        text: {
            en: { title: 'Code blocks', category: 'Fences', description: 'Filename headers, highlighting, and diff mode.' },
            ja: { title: 'コードブロック', category: 'コードフェンス', description: 'ファイル名、色付け、差分表示。' },
        },
        source: { en: codeEn, ja: codeJa },
    },
];
