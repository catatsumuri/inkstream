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
| `09:12`、`10:00` などの時刻 | 対応 | `remark-directive` がコロン付きの構文として解析する場合も、時刻を文字列として保持します。 |
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

## Generative UI（オプトイン）

React レンダラーの `generativeUi` prop を有効にすると、UIタグを使えます。既定値は `false` で、標準パイプラインでは新タグを有効にしません。独自パイプラインでは `normalizeGenerativeUiMarkdown` と `generativeUiRemarkPlugins` を組み合わせるか、`createInkstreamRemarkPlugins({ generativeUi: true })` と `normalizeInkstreamMarkdown(source, { generativeUi: true })` を使用します。

| タグ | 属性 | 備考 |
| --- | --- | --- |
| `Box` | `padding="0"`〜`"8"` | 1 単位は 0.25rem です。 |
| `Row`、`Column` | `align="start|center|end|stretch|baseline"`、`justify="start|center|end|between|around"`、`gap="0"`〜`"8"` | 値を検証します。 |
| `Icon` | `name` | 安全な小文字名のみ受け付けます。Lucide にない名前は表示しません。 |
| `Button` | `action`, `type` | アプリケーションへ操作イベントを通知します。識別子は英小文字で始まる最大64文字です。 |
| `Slider` | `id`、`label`、`min`、`max`、`step`、`default` | 数値入力です。`id`でアプリケーション管理の値と対応付けます。 |
| `Form` | `id`, `action` | 入力値を型付きでまとめてアプリへ通知 |
| `Input` | `id`, `label`, `default`, `placeholder` | 単一行テキスト入力。変更値は文字列。 |
| `Checkbox` | `id`、`label`、`default` | 真偽値入力です。`default`は`"true"`または`"false"`です。 |
| `Select` | `id`、`label`、`default` | 文字列入力です。1つ以上の`Option`を内包します。 |
| `Option` | `value` | Selectの選択肢です。値とラベルを持つブロックタグとして記述します。 |
| 既存の `Card`、`Badge` | 既存属性 | 新しい別名タグは追加しません。 |

```md
<Card title="セキュリティ診断">
  <Row align="center" gap="3">
    <Icon name="shield-check" />
    <Badge color="green">対応済み</Badge>
  </Row>
</Card>
```

対話タグの例:

```md
<Slider id="threshold" label="閾値" min="0" max="100" default="65" />

<Button action="refresh-report">レポートを更新</Button>

<Checkbox id="include-archived" label="過去の記録を含める" default="false" />

<Select id="period" label="期間" default="week">
  <Option value="day">
    日単位
  </Option>

  <Option value="week">
    週単位
  </Option>
</Select>
```

`generativeUiValues={{ threshold: value, "include-archived": false, period: "week" }}` で入力を制御し、`onGenerativeUiEvent`で`{ type: "change", id, value }`または`{ type: "action", action }`を受け取れます。変更値はSliderなら数値、Checkboxなら真偽値、Selectなら文字列です。制御入力の変更後は、アプリケーションの状態を`generativeUiValues`に渡してください。`action`がないボタンは無効になります。

表は GFM、グラフは既存の chart fence を使います。対話タグは生成された JavaScript を実行しません。`InkstreamMarkdown` の `onGenerativeUiEvent` と `generativeUiValues` props で、アプリケーションへイベント通知と値を受け渡せます。イベント通知は認可を行わないため、アプリケーション側で操作を許可し、認可してください。未許可の属性や不正な値は破棄し、vfile に診断を残します。

```xml
<Input id="query" label="検索条件" default="" placeholder="キーワード" />
```

`generativeUiValues.query` に文字列を指定すると外部制御になります（空文字列も有効）。未指定または別の型の場合は非制御となり、切り替え時は `default` に戻ります。変更時は `{ type: "change", id: "query", value: string }` を通知します。


### Form

```xml
<Form id="report-settings" action="apply-settings">
  <Input id="query" label="検索条件" />
  <Checkbox id="include-archived" label="過去の記録を含める" />
  <Button type="submit">適用</Button>
</Form>
```

送信時は `{ type: "submit", id, action, values }` を通知します。未操作の初期値と未選択Checkbox（`false`）も含み、Input・Selectは文字列、Sliderは数値、Checkboxは真偽値です。既存イベント型を網羅的に分岐するコードには `submit` 分岐を追加してください。

送信先URLや生成されたコードは実行しません。ページ遷移を抑止し、検証・認可・API通信はアプリが担当します。SSRからhydration完了までは操作を無効にします。同一Form内の入力ID重複は送信を拒否し、ネストしたFormは非表示、無効なID/actionのFormは操作不可になります。非表示入力は収集せず、空Formは空の値を通知します。

通常Buttonは従来のactionイベントを通知し、submit ButtonはFormのactionを使用します。Form外のsubmit Buttonは無効です。入力IDは文書内で一意にしてください。外部制御値は従来どおりIDで共有されます。自動収集は標準入力レンダラーが対象で、`components`で置き換えた入力は保証対象外です。Inkstreamをアプリの既存HTML form内に配置しないでください。


### Streaming

```tsx
<InkstreamMarkdown generativeUi streaming={isGenerating} onGenerativeUiEvent={handleUiEvent}>
  {generatedMarkdown}
</InkstreamMarkdown>
```

`streaming` は省略時 `false` です。アプリが生成開始時に `true`、完了時に `false` を渡します。生成中は標準のButton・Slider・Checkbox・Select・InputとForm送信を無効化し、action/change/submit通知を抑止します。Formの通常送信も抑止します。イベントの再送は行いません。UIのプレビューと外部制御値の更新は継続します。

切り替えによる再マウントや値リセットは行いません。ただし無効化時のフォーカス保持は保証しません。通常リンク・Tabs・Accordion・Quizは対象外です。カスタムレンダラーの操作と独自の副作用はアプリ側で制限してください。既存コールバック経由の通知は抑止されます。

生成完了はアプリが判断します。`false` は構文の妥当性や権限を保証せず、未閉鎖タグの補完など解析挙動は従来どおりです。ブロック単位の確定、増分解析、更新頻度制御、途中挿入時の状態保持は提供しません。

入力IDが変わる位置では入力DOMを再作成し、別IDへの非制御値の移動を防ぎます。FormのID変更時も子の状態をリセットします。途中挿入や並べ替えでは既存入力が初期値に戻る場合があります。値を保持したい場合は一意なIDとアプリ側の `generativeUiValues` を使用してください。DOMの移動後のフォーカス保持は保証しません。


### Block completion

```tsx
<InkstreamMarkdown generativeUi streaming={isGenerating} streamingMode="block">
  {generatedMarkdown}
</InkstreamMarkdown>
```

`streamingMode` の既定値は `"document"`（応答全体の完了待ち）です。`"block"` を指定すると、生成中でも明示的な閉じタグまたは自己閉鎖タグで完成したUIを操作できます。内部のタグと祖先コンテナも完成している必要があります。EOFでの自動補完・別タグでの強制補完は完成と見なしません。閉じたFormが未閉鎖Card内にある場合も操作不可です。

完成したFormは後続の生成中も送信できます。アプリはaction・値の検証と認可を継続してください。`streaming=false` では従来のフォールバックを使用します。完成判定は対応タグの対応付けに限定され、スキーマ検証やMarkdown文書全体の確定を保証しません。自己閉鎖の入力は単独なら直ちに完成と見なされます。

完成状態はReact内部のASTメタデータで渡します。標準Markdownパイプラインと公開ASTの形は変わりません。これは完成済みASTの凍結・キャッシュ・増分解析ではなく、引き続き全体を再解析します。カスタムレンダラー独自の操作や副作用の制限はアプリ側で担当してください。


### Streaming update interval

```tsx
<InkstreamMarkdown generativeUi streaming={isGenerating} streamingMode="block" streamingUpdateInterval={50}>
  {generatedMarkdown}
</InkstreamMarkdown>
```

`streamingUpdateInterval` は生成テキストの表示更新をまとめる間隔（ms）です。既定値 `0` は即時更新です。生成中だけ適用し、連続更新でもタイマーを先送りしません。生成完了（`streaming=false`）時は最新の全文を直ちに表示します。開始時とSSRは現在の入力を表示します。負値・非有限値・タイマー上限を超える値は即時更新として扱います。

入力の外部制御値・イベント・操作制限は遅延させません。ブロック完成判定は表示中のスナップショットに基づきます。同じテキストではUI状態の更新による再解析を省略しますが、テキストやパーサー設定・カスタムレンダラーが変わると全体を再解析します。`components` と `resolveWikilink` は安定した参照を使うと再利用しやすくなります。これは増分解析ではありません。

リポジトリで `npm run benchmark:streaming` を実行すると、約1万・5万文字の文書で20回の状態更新とテキスト更新を計測できます。解析回数はwikilink resolver呼び出し、描画時間はReact Profilerで計測するローカルの参考値です。ブラウザーのフレーム時間や本番環境の速度は別途確認してください。

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

## 数式

| 記法 | 状態 | 補足 |
| --- | --- | --- |
| `$x$` インライン数式 | supported | 標準で有効。通貨のドル記号は `\$` と記述 |
| 独立した `$$` 行で囲む数式 | supported | 行列などの複数行 TeX に対応 |
| `math` コードフェンス | supported | ブロック数式として表示。他言語のコードは変換しない |

React・CLI は KaTeX の HTML＋MathML を同期生成し、SSR に対応する。
既存の stylesheet に CSS とローカルフォントを含む。独自パイプラインでは
`remark-rehype` の後に `inkstreamRehypePlugins` を追加する。
不正な式は表示を残して vfile に診断を追加する。`trust` は false。
テキスト抽出は区切り記号なしの TeX を保持する。Zenn 固有の完全互換は対象外。
