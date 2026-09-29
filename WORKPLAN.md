# WORKPLAN — 着手順マスターリスト

作業の起点。**このファイルを加工しながら進める**。完了したら `[x]` + 日付、
方針変更はその場で書き換えてよい。

関連ドキュメント:

- [docs/syntax.md](docs/syntax.md) — 構文サポート表（`tests/syntax-matrix.test.ts` で固定）
- [docs/syntax-roadmap.md](docs/syntax-roadmap.md) — 構文追加の候補と ROI（未着手）
- [docs/design/distribution.md](docs/design/distribution.md) — 配布設計の経緯（アーカイブ）
- [PROPOSAL-syntax-subpath.md](PROPOSAL-syntax-subpath.md) — thinkstream 側の期待（未解決）
- [CHANGELOG.md](CHANGELOG.md) — バージョン方針とリリース履歴

## 現在地（2026-09-29）

v0.5.2 を npm に公開済み（Trusted Publishing、provenance 付き）。
バージョン方針は 0.x で「minor = 破壊的変更＋機能、patch = 修正/docs/テスト」。

## 完了済みフェーズ（要約）

- [x] Phase 0: パッケージ名を `inkstream` に決定・改名
- [x] Phase 1: 品質 — wikilink 見出しスラッグ、fence トラッキング重複、
      空フェンスの `"undefined"`、Zenn shorthand のアンカー、`columns` 欠落。
      setext 見出しと属性値の `>` は非対応と判断し docs に明記
- [x] Phase 2: 配布基盤 — LICENSE、`styles.css`（`--ink-*` + `@layer`）、
      chart 色の変数化、dist ビルド、CLI（render/text/headings）、
      npm 公開（v0.1.0〜）、Trusted Publisher 登録
- [x] Phase 4（2026-09）: ライブラリとして壊れにくくする
  - README を実装に合わせて修正（install、pipeline を実行順に）
  - fast-check の no-throw fuzz テスト（`tests/fuzz.test.ts`）
  - CHANGELOG とバージョン方針、publish 時のタグ/version 一致チェック
  - root export を公開 API に絞り `/advanced` を新設（0.5.0、破壊的）
  - `docs/syntax.md` 互換表 + `tests/syntax-matrix.test.ts`
  - 素通しだった生 HTML タグに vfile 警告（0.5.1）
  - `python expandable …` で言語が上書きされるバグ修正（0.5.2）

## 次にやること

- [ ] consumer の SSR ビルドテスト: `InkstreamMarkdown` を SSR でレンダリング
      する fixture を CI に 1 本（GitHub embed / OGP / Mermaid / ダークモード
      検出など、ブラウザ依存部の破れを公開前に検出）
- [ ] thinkstream の依存を直す（消えた commit pin → `~0.5.0`、`/syntax` の
      期待は PROPOSAL 参照）。kb_practice も `0.5.x` へ更新して typecheck

## Backlog（需要が出てから）

- 構文追加: [docs/syntax-roadmap.md](docs/syntax-roadmap.md) の P1〜P8
  （`==mark==`、コード行ハイライト、KaTeX など）。先回りせず、書きたい文書が
  現れてから。追加は `docs/syntax.md` と同時に更新する
- `expandable` を折りたたみ表示として実装する（現状は言語を壊さないだけ）
- `parse(markdown)` が `{tree, diagnostics}` を返す API（エディタ/validator を
  作る話が出たら）
- AST を型ごとに分割（`CalloutNode` 等）。per-component の属性スキーマを入れる時
- `/react` のサブパス細分化（Shiki/Recharts）、`styles.css` のソース分割
- リファクタ（該当箇所を触るときについでに）:
  - 手書き AST ビジターの統一（7 ファイル）
  - `InkstreamMarkdown` のレンダー毎再計算の memo 化
  - `parseCodeMeta` の `lang[:filename]` 分解の重複
- CI に lint 追加（eslint/prettier）
- `*caption*` 検出が `**bold**` 行にもマッチする（v1 互換なら許容）
