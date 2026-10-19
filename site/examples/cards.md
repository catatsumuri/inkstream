<CardGroup
  cols="2"
>
  <Card
    title="Getting started"
    icon="rocket"
  >
    Install the package and render your first document.
  </Card>
  <Card title="Syntax guide" icon="book-open">
    Explore the supported Markdown extensions.
  </Card>
</CardGroup>

<ParamField
  query="record"
  type="map<string, X>"
  required
>
A field with multiline attributes.
</ParamField>

<Frame
  caption="**Example** — a framed code sample"
  hint="Frames can wrap code as well as images."
>
```js
const message = "Hello, Inkstream!";
```
</Frame>
