```ts:hello.ts
export function greet(name: string) {
  return `こんにちは、${name}さん！`;
}
```

```diff ts:hello.ts
- return 'こんにちは';
+ return `こんにちは、${name}さん！`;
```
