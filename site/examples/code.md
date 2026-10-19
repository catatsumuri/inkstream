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
```js title="JavaScript" lines highlight="1"
console.log('Hello');
```

```python title="Python" lines
print('Hello')
```
</CodeGroup>

```ts title="Example.ts" lines highlight="2,4-5"
export function greet(name: string) {
  const greeting = `Hello, ${name}!`;

  console.log(greeting);
  return greeting;
}
```

```diff ts:legacy.ts title="Change.ts" lines highlight="2-3"
@@ -1 +1 @@
-const value = 1;
+const value = 2;
```
