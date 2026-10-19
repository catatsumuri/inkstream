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

```ts title="Long example.ts" lines highlight="2,14" expandable
const first = 1;
const second = 2;
const third = 3;
const fourth = 4;
const fifth = 5;
const sixth = 6;
const seventh = 7;
const eighth = 8;
const ninth = 9;
const tenth = 10;
const eleventh = 11;
const twelfth = 12;
const thirteenth = 13;
const fourteenth = 14;
console.log(fourteenth);
```
