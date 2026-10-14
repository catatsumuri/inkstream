```ts:hello.ts
export function greet(name: string) {
  return `Hello, ${name}!`;
}
```

```diff ts:hello.ts
- return 'Hello';
+ return `Hello, ${name}!`;
```
