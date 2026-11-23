# Zenn profile

This sample uses `syntax="zenn"`.
A normal source newline becomes a line break.

:::message
Messages, GFM tables, math, and Zenn inline footnotes are enabled.
:::

:::details More information
Mintlify tags and Inkstream quiz/chart/tree fences are not expanded in this profile.
:::

| Feature | Example |
| --- | --- |
| Strikethrough | ~~old wording~~ |
| Task list | See below |

- [x] Choose a profile
- [ ] Edit the source

A statement with a note^[The note can include **emphasis** and `code`.].

Inline math: $e^{i\pi} + 1 = 0$.

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

```ts:hello.ts
export const message = "Hello, Zenn!";
```

## Compare with all

<Note>This Mintlify tag stays source text in the Zenn profile.</Note>

Provider embeds also use this profile, for example `@[youtube](VIDEO_ID)`.
External embeds depend on the provider and network access.
