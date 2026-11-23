## 処理の流れ

この図は html-embed フェンスで表示します。通常の html フェンスはコード表示です。

```html-embed
<style data-theme="light">
body { background: #ffffff; color: #18181b; }
.stage { background: #f4f4f5; border-color: #d4d4d8; }
</style>
<style data-theme="dark">
body { background: #18181b; color: #fafafa; }
.stage { background: #27272a; border-color: #52525b; }
</style>
<style>
.flow { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-family: sans-serif; }
.stage { padding: 16px; border: 1px solid; border-radius: 8px; }
</style>
<div class="flow" role="img" aria-label="Markdown to AST to output">
  <div class="stage"><strong>Markdown</strong><br>Source text</div>
  <span aria-hidden="true">→</span>
  <div class="stage"><strong>AST</strong><br>remark / rehype</div>
  <span aria-hidden="true">→</span>
  <div class="stage"><strong>Output</strong><br>React / HTML</div>
</div>
```
