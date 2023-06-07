# Next.js AsyncLocalStorage Route Handler
Middleware wrapper for Next.js Route Handlers that executes requests within an AsyncLocalStorage context.

## Installation
```bash
npm install @nextwrappers/async-local-storage # npm
yarn add @nextwrappers/async-local-storage # yarn
pnpm add @nextwrappers/async-local-storage # pnpm
```

## Usage
```ts
// app/api/.../route.ts
import { asyncLocalStorage } from "@nextwrappers/async-local-storage";

export const { wrapper: asyncLocalStorageWrapper, getStore } = asyncLocalStorage({
  initialize: () => "Hello from AsyncLocalStorage!",
});

export const GET = asyncLocalStorageWrapper((req) => {
  console.log(getStore()); // "Hello from AsyncLocalStorage!"
  return new Response("OK");
});
```

By wrapping the route handler with `asyncLocalStorageWrapper`, we can access the AsyncLocalStorage store from anywhere within the callback execution with a call to `getStore()`.



# Use-Cases 📝

## Request Tracing
### `traced` wrapper
Together with `uuid`, we can trace a request through through execution and log throughout.

First we create a wrapper that initializes the store with a `traceId`:

```ts
// utils.ts
import { asyncLocalStorage } from "@nextwrappers/async-local-storage";
import { v4 as uuid } from "uuid";
import { NextRequest } from "next/server";

export const { wrapper: asyncLocalStorageWrapper, getStore } =
  asyncLocalStorage({
    initialize: (request: NextRequest) => ({
      traceId: uuid(),
      pathname: request.nextUrl.pathname
    })
  });
```

Now we define a simple logger that logs the `traceId` and the message:

```ts
// lib/logger.ts
import { getStore } from "./utils";

export const logger = (prefix: string, message: string) => {
  const { traceId, pathname } = getStore() || {};
  console.log(`[${traceId}] (${pathname}) ${prefix}: ${message}`);
};
```

Finally, we can use the logger in our route handler:

```ts
// app/api/.../route.ts
import { asyncLocalStorageWrapper, logger } from "lib";

const doSomething = async () => {
  logger("doSomething", "Doing something!");
  return new Promise((resolve) => setTimeout(()=>{
    logger("doSomething", "Done!");
    resolve("OK");
  }, 1000));
};

export const GET = asyncLocalStorageWrapper((request: NextRequest) => {
  logger("GET", "Request started!");
  const response = new Response(doSomething());
  logger("GET", "Request finished!");
  return response;
});
```

This will log something like this:
  
```text
[1b9c0b0a-7b5a-4b9f-8f9c-8b0c0b0a7b5a] (/api/...) GET: Request started!
[1b9c0b0a-7b5a-4b9f-8f9c-8b0c0b0a7b5a] (/api/...) doSomething: Doing something!
[1b9c0b0a-7b5a-4b9f-8f9c-8b0c0b0a7b5a] (/api/...) doSomething: Done!
[1b9c0b0a-7b5a-4b9f-8f9c-8b0c0b0a7b5a] (/api/...) GET: Request finished!
```
