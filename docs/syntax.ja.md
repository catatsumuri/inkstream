# 対応構文

[English](syntax.md)

inkstream は独自の **Mintlify 風** 構文を扱います。Mintlify や MDX の互換パーサーではありません。行単位の正規化と `html` ノードの AST 変換でタグを組み立てます。この表にない構文は、現在表示できても動作保証の対象外です。

| 状態 | 意味 |
| --- | --- |
| **対応** | テスト済み。動作変更は破壊的変更として扱います。 |
| **一部対応** | 条件付きで動作します。制限は備考に記載します。 |
| **非対応** | 動作しません。通常は元の文字列が表示され、vfile に警告が残ります。 |

この表は `normalizeInkstreamMarkdown` と `inkstreamRemarkPlugins` を組み合わせた標準パイプラインを対象とし、[`tests/syntax-matrix.test.ts`](../tests/syntax-matrix.test.ts) で確認しています。編集できる実例は [`site/examples/`](../site/examples/) と [`site/examples/ja/`](../site/examples/ja/) にあります。

## Markdown の基本構文

| 構文 | 状態 | 備考 |
| --- | --- | --- |
| CommonMark | 対応 | `remark-parse` を使用。 |
| GFM（表、タスクリスト、取り消し線、自動リンク） | 対応 | `remark-gfm` を使用。取り消し線は `~~` が必要で、単独の `~` は使えません。 |
| 明示的な見出し ID `## Title {#custom-id}` | 対応 | React の見出しレンダラーで適用されます。コアパイプラインと `inkstream render` では `{#id}` が文字列として残ります。 |
| Wiki リンク `[[path]]`、`[[path\|label]]` | 一部対応 | `resolveWikilink` を渡した場合のみ変換します。未指定なら文字列のままです。 |

## コールアウト

以下の構文はいずれも `aside.msg` に正規化されます。

| 構文 | 状態 | 備考 |
| --- | --- | --- |
| Mintlify 風の `<Note>` `<Tip>` `<Info>` `<Warning>` `<Check>` | 対応 | ブロック、単一行（`<Note>text</Note>`）、入れ子に対応。 |
| Zenn の `:::message` / `:::message alert` | 対応 | |
| Zenn の `:::details Title` | 対応 | `<details>` として表示。 |
| GitHub アラート `> [!NOTE]` `[!TIP]` `[!IMPORTANT]` `[!WARNING]` `[!CAUTION]` | 対応 | `WARNING` と `CAUTION` は共通の `alert` 表示。 |

## Mintlify 風コンポーネント

ブロックタグ: `Card`、`CardGroup`、`Columns`、`Tabs`、`Tab`、`Accordion`、`AccordionGroup`、`Expandable`、`Steps`、`Step`、`ResponseField`、`ParamField`、`CodeGroup`、`Update`、`Tree`（上記のコールアウトも含む）。インラインタグ: `Badge`、`Tooltip`。タグ名と属性名は `/advanced` の `MINTLIFY_*` 定数で定義しています。

| 構文 | 状態 | 備考 |
| --- | --- | --- |
| 開始・終了タグを独立した行に置くブロックタグ | 対応 | 入れ子の深さに制限はありません。 |
| 単一行の `<Card>text</Card>` | 対応 | 行全体が一組のタグである場合。 |
| 自己終了タグ `<Card title="a" />` | 対応 | |
| 文中の `Badge` / `Tooltip` | 対応 | |
| `name="value"` 形式の属性 | 対応 | `hProperties` に渡る属性名は許可リストに限ります。解析済み属性の全体はノードに残ります。 |
| 配列属性 `tags={["A", "B"]}` | 対応 | `tags="A,B"` に変換します。 |
| 引用符付き属性値の文字参照（`&#x22;`、`&quot;`） | 対応 | 1 回だけ復号します。波括弧内の文字列リテラル `{"..."}` は復号しません。 |
| `<Expandable title="..." defaultOpen>` | 対応 | `<details>` を表示します。`ParamField` 内などに入れ子にもできます。 |
| その他の JSX 式属性 `title={"x"}` | 非対応 | タグを認識しません。終了タグには警告が出ます。 |
| 複数行にまたがる開始タグ | 非対応 | タグを認識しません。終了タグには警告が出ます。 |
| 引用符付き属性値内の `>`（`type="map<string, X>"`） | 対応 | 引用符を考慮して解析します。タグ自体は単一行に限ります。 |
| 未知のタグ名 `<Foo>` | 非対応 | 生 HTML のまま残り、警告が出ます。 |
| 閉じていないタグ | 対応 | 親ノードの末尾で自動的に閉じ、警告を出します。 |
| 対応する開始タグのない終了タグ | 対応 | 文字列として残り、警告を出します。 |
| 空の `>` 行で区切った引用内のタグ | 対応 | |
| 区切りのない引用内のタグ（`> <Note>` / `> text`） | 非対応 | 生 HTML として残り、警告が出ます。 |
| リスト項目内のタグ | 対応 | 項目の本文位置まで字下げし、タグ前に空行を置きます。`Tab` / `Step` 内のフェンスも項目内に残ります。 |
| `<Tree><Tree.Folder>…</Tree>` | 対応 | ` ```tree ` と同じノードに変換します。 |
| MDX の `import`/`export`、`{式}`、`{/* コメント */}`、JSX フラグメント | 非対応 | 文字列として残ります。 |
| 標準 Mintlify プロファイルのコンポーネント別属性スキーマ | 非対応 | 共通の許可リストを使用します。静的 Generative UI プロファイルは限定された属性スキーマを持ちます。 |

## 静的 Generative UI（オプトイン）

React レンダラーの `generativeUi` prop を有効にすると、静的なUIタグを使えます。既定値は `false` で、標準パイプラインでは新タグを有効にしません。独自パイプラインでは `normalizeGenerativeUiMarkdown` と `generativeUiRemarkPlugins` を組み合わせるか、`createInkstreamRemarkPlugins({ generativeUi: true })` と `normalizeInkstreamMarkdown(source, { generativeUi: true })` を使用します。

| タグ | 属性 | 備考 |
| --- | --- | --- |
| `Box` | `padding="0"`〜`"8"` | 1 単位は 0.25rem です。 |
| `Row`、`Column` | `align="start|center|end|stretch|baseline"`、`justify="start|center|end|between|around"`、`gap="0"`〜`"8"` | 値を検証します。 |
| `Icon` | `name` | 安全な小文字名のみ受け付けます。Lucide にない名前は表示しません。 |
| 既存の `Card`、`Badge` | 既存属性 | 新しい別名タグは追加しません。 |

```md
<Card title="セキュリティ診断">
  <Row align="center" gap="3">
    <Icon name="shield-check" />
    <Badge color="green">対応済み</Badge>
  </Row>
</Card>
```

表は GFM、グラフは既存の chart fence を使います。新しいUIタグは JavaScript を実行せず、状態やイベントも持ちません。未許可の属性や不正な値は破棄し、vfile に診断を残します。

## 対応する HTML の一部

任意の生 HTML は有効にしません。以下の安全な形式のみ標準ノードに変換し、それ以外は文字列として残します。

| 構文 | 状態 | 備考 |
| --- | --- | --- |
| 空のアンカー `<a id="x" />`、`<a id="x"></a>`、`<a name="x"></a>` | 対応 | `[link](#x)` のリンク先になる `<span id="x">` を作ります。連続する行にも対応。`id` / `name` は安全な値のみ受け付けます（空白、引用符、`<>&=` は不可）。 |
| `<h1>`〜`<h6>` の見出し（単一行・複数行、任意の `id`） | 対応 | Markdown 見出しに変換し、表示・`extractMarkdownHeadings`・重複 ID の採番を揃えます。本文はインライン Markdown として解釈。`class`、`style`、イベント属性などは削除。許可外の ID は無視し、スラッグを使います。閉じタグがない、余分な文字がある、内部に空行がある場合は変換しません。 |
| `<a href="...">label</a>`（インライン・独立、任意の `title` / `target="_blank"`） | 対応 | Markdown リンクに変換します。`href` は http(s)、`mailto:`、相対パス、`#fragment` のみ許可。`target="_blank"` には `rel="noopener noreferrer"` を付けます。他の属性は削除し、JSX 式は評価しません。対応する終了タグが必要で、入れ子の `<a>` は不可。 |
| ラベルが空の `<a id="x" href="...">` | 非対応 | 文字列として残ります。 |
| `<img src="..." alt="..." width="100" height="56" />` | 対応 | Markdown 画像に変換します。`src` は http(s) または相対パスのみ。寸法は正の整数だけを保持します。`alt` と `title` を読み、その他の属性や JSX 式は無視します。インライン、独立した行、リンク内に対応。 |

## コードフェンスのコンポーネント

| フェンス | 状態 | 備考 |
| --- | --- | --- |
| ` ```tree ` | 対応 | スラッシュ区切りのパスまたは `tree` コマンド形式。形式不正なら警告を出し、通常のコードブロックとして残します。 |
| ` ```quiz ` | 対応 | `question:`、`A:` / `B:` など、`correct:`。任意で `hint:` / `explanation:`。形式不正なら警告してコードブロックとして残します。 |
| ` ```chart:bar `、` ```chart:radar ` | 対応 | `label: value` 形式の行。形式不正なら警告してコードブロックとして残します。 |
| ` ```mermaid ` | 対応 | React 側で表示します。`mermaid` は任意の peer dependency です。 |
| ` ```lang:filename `、` ```diff lang:filename ` | 対応 | コードのメタ情報を `metastring` としてレンダラーに渡します。 |

## Zenn の拡張

| 構文 | 状態 | 備考 |
| --- | --- | --- |
| `![alt](url =250x)` | 対応 | サイズを URL のクエリに記録し、`parseImageMetadata` で読み戻します。 |
| 画像の直下の `*caption*` 行 | 対応 | |
| `@[card](url)`、`@[github](url)` | 対応 | URL だけの行に変換してから埋め込みを処理します。 |
| その他の Zenn 埋め込み（`@[youtube]`、`@[tweet]` など） | 非対応 | 通常の Markdown リンクとして解析します。 |

## 単独の URL からの埋め込み

URL だけを書いた行は埋め込みに変換します。

| URL | 状態 | 備考 |
| --- | --- | --- |
| YouTube | 対応 | |
| GitHub のファイル（`https://github.com/o/r/blob/branch/path#L1-L9`） | 対応 | ブラウザーから `raw.githubusercontent.com` に直接アクセスします。 |
| その他の `http(s)` URL | 一部対応 | リンクカードを表示します。OGP 情報にはアプリ側の `ogpEndpoint` が必要で、未指定なら URL のみ表示します。 |

## 診断情報

対応しない終了タグ、閉じていないタグ、生 HTML として残った大文字始まりのタグ、形式不正の tree / quiz / chart フェンスは `file.messages` に警告を記録します。通常は例外を投げません。任意入力で例外を投げないことは [`tests/fuzz.test.ts`](../tests/fuzz.test.ts) で検証しています。

## この表の更新

「非対応」から「対応」への変更は機能追加です。「対応」とした構文の動作変更は破壊的変更です。バージョン方針は [CHANGELOG](../CHANGELOG.md) を参照してください。英語版の表とテストも併せて更新します。
