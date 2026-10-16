```ts:hello.ts
export function greet(name: string) {
  return `Hello, ${name}!`;
}
```

```diff ts:hello.ts
- return 'Hello';
+ return `Hello, ${name}!`;
```

<Tabs>
<Tab title="JavaScript">
JavaScript example.
</Tab>
<Tab title="Python">
Python example.
</Tab>
</Tabs>

<CodeGroup>
```js:JavaScript
console.log('Hello');
```

```python:Python
print('Hello')
```
</CodeGroup>
