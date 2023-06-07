# Next.js Middleware Matching Paths
Middleware wrapper for Next.js that selectively applies a middleware logic based on the request path.

## Installation
```bash
npm install @nextwrappers/matching-paths # npm
yarn add @nextwrappers/matching-paths # yarn
pnpm add @nextwrappers/matching-paths # pnpm
```

## Usage
```ts
// middleware.ts
import { matchingPaths } from "@nextwrappers/matching-paths";

const withGreeting = matchingPaths(
  { matcher: ["/dashboard/:path*"] },
  (next, req) => {
    console.log(`Entering middleware '${req.nextUrl.pathname}'!`);
    const res = next();
    console.log(`Leaving middleware '${req.nextUrl.pathname}'!`);
    return res;
  }
);

export const middleware = withGreeting((req) => {
  return NextResponse.next();
});
```

Following this, all requests to `/dashboard/*` will be logged with the greeting, and others will be ignored.


# Use-Cases 📝

## Authentication with NextAuth.js 
### `withCheckAuth`
We can couple this library with `next-auth` to selectively apply authentication to certain paths.

> Caveat: in this use-case `withAuth` is only called on the matching paths.
> 
> If you always want to call `withAuth` (for example to set the decoded JWT on all paths if present) while redirecting under the same conditions (or custom logic), use `withAuth` directly and implement the custom logic in it's `authorize` callback. See more in NextAuth docs [here](https://next-auth.js.org/configuration/nextjs#wrap-middleware).

```ts
// middleware.ts
import { matchingPaths } from "@nextwrappers/matching-paths";
import { withAuth, NextAuthMiddlewareOptions } from "next-auth/middleware";

const authOptions: NextAuthMiddlewareOptions = {
  // ...
};

const withCheckAuth = matchingPaths(
  { matcher: ["/dashboard/:path*"] },
  // @ts-expect-error - withAuth types do not narrow down to the expected return type
  (next, req) => withAuth(next, authOptions)(req)
);

export const middleware = withCheckAuth((req) => {
  return NextResponse.next();
});
```