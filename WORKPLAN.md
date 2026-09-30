# WORKPLAN — 着手順マスターリスト

作業の起点。**このファイルを加工しながら進める**。完了したら `[x]` + 日付、
方針変更はその場で書き換えてよい。

関連ドキュメント:

- [docs/syntax.md](docs/syntax.md) — 構文サポート表（`tests/syntax-matrix.test.ts` で固定）
- [docs/syntax-roadmap.md](docs/syntax-roadmap.md) — 構文追加の候補と ROI（未着手）
- [docs/design/distribution.md](docs/design/distribution.md) — 配布設計の経緯（アーカイブ）
- [PROPOSAL-syntax-subpath.md](PROPOSAL-syntax-subpath.md) — thinkstream 側の期待（未解決）
- [CHANGELOG.md](CHANGELOG.md) — バージョン方針とリリース履歴
- [skills/](skills) — Agent Skill（`inkstream-cli`、`inkstream-syntax`）。構文や CLI の
  挙動を変えたら、ここも `docs/syntax.md` と一緒に更新する

## 現在地（2026-09-30）

v0.7.1 を npm に公開済み（Trusted Publishing、provenance 付き）。
バージョン方針は 0.x で「minor = 破壊的変更＋機能、patch = 修正/docs/テスト」。
進め方: バグレポは 1 件ずつ別 PR（再現 → 原因 → テスト → 修正 → CHANGELOG）、
マージ後にリリース。構文の挙動を変えたら `docs/syntax.md` と
`tests/syntax-matrix.test.ts` を同時に更新する。

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
- [x] Phase 5（2026-09〜）: kb_practice の QA 報告への対応
  - API フィールド: 引用符内の `>`（`type="map<string, X>"`）、属性の文字参照、
    `<Expandable>` の追加（0.6.0）
  - CLI 修正（未知のコマンドで固まる／読めないファイルの表示）と Agent Skill 2 つ（0.7.0）
  - 制限付き HTML 対応（0.7.0）。raw HTML は有効にせず、許可した形だけを標準ノードに変換:
    空アンカー `<a id>`、見出し `<h1>`–`<h6>`（描画と目次 API が一致）、
    リンク `<a href>`（URL 検査は共有の `safe-url.ts`）、画像 `<img>`
  - 番号付きリスト内のタグ（Tabs/Note）がリストを壊す問題を修正（0.7.0）
  - `lucide-react` を必須 peer に修正、optional peer の矛盾を検出するテスト（0.7.1）

## 次にやること

- [x] consumer の SSR スモークテスト（`scripts/ssr-smoke.mjs`、
      `npm run smoke:ssr`、CI と publish に組み込み済み）。ビルド済みパッケージを
      公開名で読み込み、DOM なしの素の Node で `renderToString`
- [ ] thinkstream の依存を直す（消えた commit pin → `~0.7.1`、`/syntax` の
      期待は PROPOSAL 参照）。kb_practice も npm の `~0.7.1` へ切り替えて typecheck。
      ハンドオフ報告のページ（見出しの ID とジャンプ、リスト内 Tabs、リンクと画像）を
      実ブラウザで確認する
- [ ] 報告側（アプリ）の担当として整理済み: 独自コンポーネント（`SdkSignature` 等）の
      平坦化、`/path#fragment` の存在チェック

## Backlog（需要が出てから）

- 構文追加: [docs/syntax-roadmap.md](docs/syntax-roadmap.md) の P1〜P8
  （`==mark==`、コード行ハイライト、KaTeX など）。先回りせず、書きたい文書が
  現れてから。追加は `docs/syntax.md` と同時に更新する
- コードフェンスの `expandable` フラグを折りたたみ表示として実装する
  （`<Expandable>` タグは対応済み。フェンスのフラグは、現状は言語を壊さないだけ）
- 制限付き HTML の拡張候補: デフォルト `img` レンダラーが `title` を使わない
  （Markdown 画像も同じ）、`tel:` リンク（react-markdown が空 href にするため未許可）、
  `<h5>`/`<h6>` を目次 API の対象にする、アンカーと見出しの `id` 重複の検出
- `lucide-react` を本当に optional にする（8 個のアイコンをインライン SVG 化し、
  動的アイコンを遅延読み込み）。現状は必須 peer
- `lucide-react` 1.x（最新 1.49.0）は peer の範囲外（`<1.0.0`）。1.x が `dynamic` /
  `iconNames` を持つか未確認
- 素の Node の ESM（bundler なし）で `/react` を直接動かす場合、`lucide-react` に
  `exports` が無い版（0.577.0 など）だと `lucide-react/dynamic` を解決できない
  （bundler 経由は問題なし。README に記載済み）
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
