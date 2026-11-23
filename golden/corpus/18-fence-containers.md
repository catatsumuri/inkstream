# Continuation fence exits its nested list

- Outer
  - Inner

    ```md
    <Card
      title="Literal"
    />
    <Card title="Single-line literal" />

  <Card
    title="After parent"
  />

# Continuation fence exits its quoted list

> - Item
>
>   ```md
>   <Card
>     title="Literal"
>   />
>   <Card title="Single-line literal" />
>
> <Card
>   title="After quote"
> />
