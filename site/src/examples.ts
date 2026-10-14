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
    text: Record<Language, ExampleText>;
    source: Record<Language, string>;
}

export const examples: Example[] = [
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
            en: { title: 'Cards', category: 'Components', description: 'Group linked or unlinked content into responsive tiles.' },
            ja: { title: 'カード', category: 'コンポーネント', description: '内容をカードにまとめ、画面幅に合わせて並べます。' },
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
        text: {
            en: { title: 'Zenn directives', category: 'Syntax', description: 'Messages and details without JSX-like tags.' },
            ja: { title: 'Zenn ディレクティブ', category: '構文', description: 'JSX 風タグを使わずにメッセージや詳細を表示します。' },
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
            en: { title: 'Generative UI', category: 'Static UI', description: 'Compose cards and layouts with the opt-in Box, Row, Column, and Icon tags.' },
            ja: { title: 'Generative UI', category: '静的UI', description: 'Box、Row、Column、Iconを使ってカードやレイアウトを組み立てます。' },
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
