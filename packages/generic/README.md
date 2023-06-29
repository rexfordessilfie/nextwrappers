# (Generic) Function Wrappers

Create generic and transparent wrappers for functions with strong type-inference.

The goals of the helper functions of this library are to be:

1. **Generic**: wrappers can be created for any function/'class' of functions
2. **Transparent**: applying wrappers to functions does not affect the type signature of the function
3. **Type Safe**: wrappers cannot be applied to functions with mismatching types

## Installation

In Progress

<!-- ```bash
npm install @nextwrappers/generic # npm
yarn add @nextwrappers/generic # yarn
pnpm add @nextwrappers/generic # pnpm
``` -->

## API

- `typedWrapperCreator()`- Returns a function for creating wrappers based on provied types.
- `createWrpaper()`- Creates a wrapper for a function.

# Usage

### `typedWrapperCreator`

Use Case - Creating a strongly typed binary operator wrapper that takes the absolute of the return.

```ts
const binOpAbs = createBinOpWrapper((next) => {
  // Execute the wrapped function.
  const result = next<number>();

  if (result > 0) {
    return result;
  } else {
    return Math.abs(result) as typeof result;
  }
});

export function add(a: number, b: number) {
  return a + b;
}

export function subtract(a: number, b: number) {
  return a - b;
}

export const addAbs = binOpAbs(add);
export const subtractAbs = binOpAbs(subtract);
```

### `createWrapper`

Use Case - Creating a wrapper for a Next.js route handler

```ts
const myLogger = createWrapper((next, req: Request) => {
  console.log(`starting '${next[nextFuncSymbol].name}', method:${req.method}`);

  // Execute the wrapped function. Adding explicit Response type for easy inference later on
  const response = next<Response>();

  console.log(`finished '${next[nextFuncSymbol].name}'`);

  response.headers.set("X-IsWrapped", "true");
  return response;
});

const handler = myLogger(function () {
  return new Response("OK", { status: 200 });
});
```
