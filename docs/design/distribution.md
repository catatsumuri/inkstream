# 配布ロードマップ: CLI / npm 化 / CSS 同梱（2026-07-19）

> **アーカイブ（完了済み）**: ここに書かれた 3 論点はすべて実装・公開済み
> （v0.1.0〜）。設計判断の経緯を残すために保管している。

構文拡張（[syntax-roadmap.md](../syntax-roadmap.md)）とは別軸の、パッケージ配布に関する検討記録。
3つの論点は独立に見えて、**「dist ビルド整備」という同じ前提工事に収束する**。

## 論点1: CLI（プレーンテキスト変換ほか）→ 対応済み（2026-07-19）

`src/cli.ts`（`bin: inkstream`）として実装。`render`/`text`/`headings`
の3サブコマンド、ファイル引数 or stdin、`text` は下記の設計注意どおり
tree/quiz/chart の JSON ペイロードを明示的にテキスト化。
`src/extract-plain-text.ts` として core（React非依存）から独立 export
済みなので、CLI を経由せず直接ライブラリとしても使える。テスト20件
（extract-plain-text 12件 + cli 8件）追加、golden 14/14 . 詳細は
README の「## CLI」セクション参照。

コアは React 非依存で、`golden/render-v2.ts` が既に markdown → HTML を
unified パイプラインだけで実現している。CLI の中身は実質書き終わっており、
`bin` エントリを被せるだけ。

### サブコマンド案

| コマンド | 出力 | 用途 |
| --- | --- | --- |
| `inkstream render <file>` | HTML | RSS、OGP 用静的ページ、メール本文などの SSR |
| `inkstream text <file>` | プレーンテキスト | **本命**。全文検索インデックス、抜粋、OGP description |
| `inkstream headings <file> --json` | 見出し JSON | サーバ側での目次事前計算 |

kb_practice の検索は現状、生 Markdown（`<Card title=...>` や ```` ```quiz ````
のシンタックスノイズ込み）を対象にするしかない。`text` があれば Laravel 側から
`Process` 経由で正しいインデックス対象を作れる。

### 設計上の注意: テキスト抽出は to-string だけでは済まない

tree/quiz/chart は JSON ペイロードを hProperties に持ち children が空なので、
mdast-util-to-string を素通しすると**クイズの問題文などが検索から消える**。
どのコンポーネントの何を拾うか（quiz の question は拾う、tree のファイル名は
拾う、chart のラベルは拾う…）は小さいが明示的な設計判断が要る。

## 論点2: npm 化

方向性は決定。ただし**順序が大事**:

- **名前を publish 前に決める** — 以前見送った「2外し」
  （inkstream2 → inkstream）は npm 公開前が最後のチャンス。
  GitHub の commit pin なら改名はリダイレクトで済むが、npm レジストリでは
  deprecate + 別名再公開になり後戻りできない。
- **exports の `.ts` 直指しを解消** — tsc/tsup で dist（ESM + `.d.ts`）を
  吐く build が必須。**これは CLI の前提でもある**（Node は素の TS を
  実行できない）。一つの工事で両方が開通する。
- **LICENSE ファイル追加**（当時の指摘のまま未対応。現在は追加済み）。
- **コードレビューの主要バグを先に潰す** — commit pin は「動く一点」を指すが
  semver は約束。公開直後に破壊的修正を積まないため、少なくとも §1-1
  （wikilink 見出しスラッグ）は 0.1.0 前に。
- **得るもの**: semver での依存管理、`npx` での CLI 配布、CI からの
  provenance 付き publish（GitHub Actions trusted publishing）、
  kb_practice 以外の消費者への道。

## 論点3: CSS のパッケージ同梱

### 現状分析（kb_practice の resources/css/inkstream.css）

617行・`@apply` 136箇所だが、テーマ結合は実質 **8トークン**に集約:
`border-border`(24) `text-muted-foreground`(19) `bg-muted`(14)
`text-foreground`(5) `text-primary`(4) `bg-card`(2) `bg-accent`(1)
+ `--shiki-*`(8) + `dark:`(7)。
「見た目の骨格」は汎用で、「色」だけがアプリのデザインシステムに刺さっている。

### 方針: そのまま移さず「デフォルト CSS + テーマ変数ブリッジ」

そのまま移すと Tailwind v4 + shadcn テーマが隠れ peer dependency になる。
代わりに:

1. **パッケージ側** — `@apply` を素の CSS に展開した `styles.css` を同梱。
   テーマ値はすべて `--ink-*` カスタムプロパティ + 中立フォールバック:

   ```css
   @layer inkstream {
       .ink-callout { border: 1px solid var(--ink-border, #e5e7eb); }
       .ink-card-title { color: var(--ink-fg, #111827); }
   }
   ```

   `@layer` で包むことで消費者の上書きが specificity 戦争なしで必ず勝つ。
   ダークモードは既存の `.dark` クラス契約のまま変数側で切替。

2. **kb 側** — 617行が「トークンブリッジ + アプリ固有微調整」の20〜30行に縮む:

   ```css
   :root { --ink-border: var(--border); --ink-fg: var(--foreground); }
   ```

3. **副産物** — コードレビュー指摘の chart 色ハードコード（chart の色ハードコード）が同じ仕組みで解決する
   （`getComputedStyle` で `--ink-chart-*` を読む）。CSS 同梱をやるなら
   この一貫性は必須級。

### README 2層モデルとの整合

「スタイルなし」の原則は「デフォルトの見た目は Layer 1（`styles.css` の
import 1行）、テーマ合わせが Layer 2（変数ブリッジ）」に昇格する。
境界線の思想（構造＝ライブラリ / 見た目の決定権＝アプリ）は壊れない。
実装時に README の Layer 2 表の stylesheet 行を更新すること。

### 配布面

`exports` に `"./styles.css"` を足すだけ。CSS はビルド不要なので
GitHub pin のままでも npm でも動く（3論点の中で唯一 dist 工事に依存しない —
先行着手可能）。ただし semver 上の扱いに注意: スタイル変更は消費者の
見た目を変えるので、公開後は patch でなく minor として扱うのが安全。

## 推奨シーケンス（3論点統合）

```
1. ~~名前を決める~~ → 対応済み（2026-07-19）: inkstream に改名
   （GitHub リポジトリ・package.json・ローカルディレクトリ・
   kb_practice のピン一式）
2. LICENSE 追加 + 主要バグ修正
3. CSS 同梱（dist 不要なので先行可）: styles.css + --ink-* 変数化
   + chart 色の変数化 + kb 側をブリッジに縮小
4. build 整備（tsc → dist + d.ts、exports 切替、files フィールド）
5. CLI 追加（render / text / headings、bin エントリ）
6. 0.1.0 を CI から provenance 付きで publish
7. kb_practice のピンを github:#hash → semver に切替
```

CLI だけ先行したい場合は 4→5 を GitHub pin のまま出すことも可能
（npx は使えないが node_modules 経由で実行はできる）。
