```ts:hello.ts
export function greet(name: string) {
  return `こんにちは、${name}さん！`;
}
```

```diff ts:hello.ts
- return 'こんにちは';
+ return `こんにちは、${name}さん！`;
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
