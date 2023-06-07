# Next.js Wrappers Core
Create wrappers for Next.js Route Handler and Middleware.

## Installation
```bash
npm install @nextwrappers/core # npm
yarn add @nextwrappers/core # yarn
pnpm add @nextwrappers/core # pnpm
```

# Usage

## Routes
```ts
// api/hello/route.ts
import { wrapper } from "@nextwrappers/core";
import { NextRequest, NextResponse } from "next/server";

const hello = wrapper((next, req: NextRequest) => {
  console.log(`Hello '${req.nextUrl.pathname}'!`);
  const res = next();
  console.log(`Bye '${req.nextUrl.pathname}'!`);
  return res;
});

export default hello((req) => {
  return NextResponse.json({ message: "hello" });
});
```

## Middleware
```ts
// api/hello/middleware.ts
import { wrapperM } from "@nextwrappers/core";
import { NextRequest, NextResponse } from "next/server";

const hello = wrapperM(async (next, req: NextRequest) => {
  console.log(`Hello '${req.nextUrl.pathname}'!`);
  const res = await next();
  console.log(`Bye '${req.nextUrl.pathname}'!`);
  return res;
});

export default hello((req) => {
  return NextResponse.next();
});
```

## API
* `wrapper()`, `wrapperM()` - For creating Route Handler/Middleware wrappers.
* `stack()`, `stackM()` - For creating a stack of Route Handler/Middleware wrappers.
* `chain()`, `chainM()` - For creating a chain of Route Handler/Middleware wrappers.
* `merge()`, `mergeM()` - For merging two Route Handler/Middleware wrappers.

See more in [Features](https://github.com/rexfordessilfie/next-route-handler-wrappers#features-).

# Use-Cases 📝
See more in [Use-Cases](https://github.com/rexfordessilfie/next-route-handler-wrappers#use-cases-).

Also see [Using 3rd-Party Route Handlers](https://github.com/rexfordessilfie/next-route-handler-wrappers#using-3rd-party-route-handlers) for use with route handlers from libraries.