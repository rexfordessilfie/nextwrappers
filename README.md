# Next.js Route Handler Wrappers
Reusable, composable middleware-like wrappers for Next.js App Router [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) and [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware).

## Get Started 🚀
1. First install the library using your favorite package manager:
    ```bash
    npm install @nextwrappers/core # npm
    yarn add @nextwrappers/core # yarn
    pnpm add @nextwrappers/core # pnpm
    ```
2. Next, create a route handler wrapper function with `wrapper`, as follows:

    ```ts
    // lib/wrappers/wrapped.ts
    import { wrapper } from "@nextwrappers/core";
    import { NextRequest } from "next/server";

    export const wrapped = wrapper(
      async (next, request: NextRequest & { isWrapped: boolean }) => {
        request.isWrapped = true;
        const response = await next();
        response.headers.set("X-Is-Wrapped", "true");
        return response;
      }
    );
    ```
3. Finally, wrap the wrapper around an Next.js API handler in a pages/api file:
    ```ts
    // app/api/hello/route.ts
    import { wrapped } from "lib/wrappers";
    import { NextResponse } from "next/server";

    export const GET = wrapped((request) => {
      console.log(request.isWrapped); // => true
      return NextResponse.json({ message: "Hello from Next.js API!" });
    });
    ```

# Features ✨
Here are some of the utility methods provided by this library.
## `wrapper()`, `wrapperM()`
Creates a wrapper around a route/middleware handler that performs some arbitrary piece of logic. 

It gives you access to the route handler's `request`, an `ext` object containing path parameters, and a `next` function for executing the wrapped route handler.


### Example - `authenticated()`
Ensure a user has been authenticated with next-auth before continuing with request, then attach current user to the request.
```ts
import { getServerSession } from "next-auth/react";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "app/api/auth/[...nextauth]/route.ts";
import { wrapper } from "@nextwrappers/core";

export const authenticated = wrapper(
  async (next, request: NextRequest & { user: Session["user"] }) => {
    const { user } = await getServerSession(authOptions);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    request.user = session.user;
    return next();
  }
);
```

### Example - `restrictedTo()`
We can also create wrappers with arguments, such as this one to ensure a user has the right role to access the API route.
```ts
import { wrapper, InferReq } from "@nextwrappers/core";
import { NextResponse } from "next/server";

import { authenticated } from "lib/auth-wrapper";

export const userLevels = {
  guest: 0,
  user: 1,
  admin: 2,
} as const;

export function restrictedTo(level: number) {

  return wrapper(async (next, request: InferReq<typeof authenticated>) => {
    const userLevel = userLevels[request.user.role ?? "guest"];
    if (userLevel < level) {
      return NextResponse.json(
        { message: "Unauthorized operation!" },
        { status: 403 }
      );
    }

    return next();
  });
}
```

> NB: `InferReq` is a utility type that lets us infer the request type of a wrapper. This is useful when we want to combine multiple wrappers that share the same request type.

## `stack()`, `stackM()`
Combines multiple wrappers into one to be applied within the same request. The wrappers are executed with the *last* wrapper being wrapped closest to the route handler.

Building from the example above, we can combine `restrictedTo` and `authenticated` wrappers to restrict a route to authenticated users with a particular role. 

```ts
import { stack } from "@nextwrappers/core";
import { authenticated, restrictedTo, userLevels } from "lib/wrappers";

const restrictedToUser = stack(authenticated).with(restrictedTo(userLevels.user));
const restrictedToAdmin = stack(authenticated).with(restrictedTo(userLevels.admin));
```
  
## `chain()`, `chainM()`
Combines wrappers like `stack`, except that the wrappers are executed with the *first* wrapper being wrapped closest to the route handler.

Building from the previous example, we can express the above wrappers with `chain` as:
```ts
import { chain } from "@nextwrappers/core";
import { authenticated, restrictedTo, userLevels } from "lib/wrappers";

const restrictedToUser = chain(restrictedTo(userLevels.user)).with(authenticated);
const restrictedToAdmin = chain(restrictedTo(userLevels.admin)).with(authenticated);

```
  
In general, `stack` is more ergonomic since we add onto the back, versus at the front with `chain`.
  
## `merge()`, `mergeM()` 
Combines two wrappers at a time into one. The second wrapper is wrapped closest to the route handler.

Both `stack` and `chain` are built on top of `merge`!

Again, we can express the above wrapper as:
```ts
import { merge } from "@nextwrappers/core";
import { authenticated, restrictedTo, userLevels } from "lib/wrappers";

const restrictedToUser = merge(authenticated, restrictedTo(userLevels.user));
const restrictedToAdmin = merge(authenticated, restrictedTo(userLevels.admin));
```

> The `stack` and `chain` have a `.with()` for endless wrapper combination, but `merge` does not. However, since the result of `merge` is a wrapper, we can combine multiple `merge` calls to achieve the same effect:
```ts
import { merge } from "@nextwrappers/core"
import { w1, w2, w3, w4 } from "lib/wrappers"

const superWrapper = merge(merge(merge(w1, w2), w3), w4);
```

# Use-Cases 📝
Here are some common ideas and use-cases for `@nextwrappers/core`:

## Matching Paths in `middleware.ts`
We can define a matcher middleware wrapper that selectively applies a middleware logic based on the request path, building on top of Next.js' ["Matching Paths"](https://nextjs.org/docs/app/building-your-application/routing/middleware#matching-paths) documentation.

This functionality is available as source-code and as a library. See docs [here](/packages/matching-paths/).

## Request Tracing
We can use a `traced` wrapper to trace the request with a unique ID. This is useful for debugging and logging. 

This involves using async local storage, which is available as source-code and as a library. See docs [here](/packages/async-local-storage/).

## Logging and Error Handling
For logging and handling errors at the route handler level, we can use a `logged` wrapper. This one uses the [`pino`](https://getpino.io/#/) logger, but you can use any logger you want.

### `logged()`
```ts
import { wrapper } from "@nextwrappers/core";
import { NextRequest, NextResponse } from "next/server";
import pino from "pino";

const logger = pino();

export const logged = wrapper(
  async (next, request: NextRequest, { params }) => {
    const start = Date.now();
    const { pathname, href } = request.nextUrl;

    logger.info(
      {
        params
      },
      `[${request.method}] ${pathname} started`
    );

    try {
      const response = await next();

      logger.info(
        {
          status: response.status
        },
        `[${request.method}] ${pathname} completed (${Date.now() - start}ms)`
      );
      return response;
    } catch (e) {
      logger.error(
        {
          reason: (e as Error).message
        },
        `[${request.method}] ${pathname} errored (${Date.now() - start}ms)`
      );

      return NextResponse.json(
        { error: "Request failed", reason: (e as Error).message },
        { status: 500 }
      );
    }
  }
);
```

> We can couple this with the request tracing wrapper to have all logs include the trace ID. To do so, we simply import and use the `getStore` function provided by the AsyncLocalStorage wrapper. See more [here](/packages/async-local-storage/).

**Usage**
```ts
// app/api/user/[id]/route.ts
import { logged } from "lib/wrappers";
import { NextRequest, NextResponse } from "next/server";

export const GET = logged((request, { params }) => {
  const { id } = params;
  return NextResponse.json({ id });
});
```

## Request Validation
We can perform validation of any parts of the request, including the body, query, or even path parameters. We can use the [`zod`](https://zod.dev) validator for this, and then attach the parsed values to the request object.
### `validated()`
```ts
import { wrapper } from "@nextwrappers/core";
import { z } from "zod";
import { NextRequest } from "next/server";

export function validated<B extends z.Schema, Q extends z.Schema>(schemas: {
  body?: B;
  query?: Q;
}) {
  return wrapper(
    async (
      next,
      req: NextRequest & { bodyParsed?: z.infer<B>; queryParsed?: z.infer<Q> }
    ) => {
      if (schemas.body) {
        const body = await req.json();
        req.bodyParsed = schemas.body.parse(body);
      }

      if (schemas.query) {
        const query = getQueryObject(req.url);
        req.queryParsed = schemas.query.parse(query);
      }

      return next();
    }
  );
}

function getQueryObject(url: string) {
  const query: Record<string, any> = {};

  new URL(url).searchParams.forEach((value, key) => {
    if (Array.isArray(query[key])) {
      query[key].push(value);
      return;
    }

    if (query[key]) {
      query[key] = [query[key], value];
      return;
    }

    query[key] = value;
  });

  return query;
}
```

**Usage**

```ts
//app/api/user/[id]/route.ts
import { NextResponse } from "next/server";
import { User } from "lib/models";
import { dbConnect } from "lib/db";
import { userUpdateSchema } from "lib/schemas";
import {
  protectedWrapped,
  validated,
  restrictedToSpecificUser
} from "lib/wrappers";

type RouteInfo = {
  params: {
    id: string;
  };
};

const wrappedPost = protectedWrapped
  .with(
    /* Only allow current user to update their own information */
    restrictedToSpecificUser((_, { params }: RouteInfo) => params.id)
  )
  .with(
    /* Ensure sure request body is valid */
    validated({
      body: userUpdateSchema
    })
  );

export const POST = wrappedPost(async (request, { params }: RouteInfo) => {
  await dbConnect();

  const user = await User.findByIdAndUpdate(params.id, request.bodyParsed, {
    new: true
  });

  return NextResponse.json({ user });
});
```

# Using 3rd-Party Route Handlers
Any wrapper created with this library can readily be used with route handlers provided by other libraries.

## With [tRPC](https://trpc.io)
Adapted from [here](https://trpc.io/docs/server/adapters/nextjs#route-handlers)
```ts
// app/api/trpc/[trpc]/route.ts
import * as trpcNext from "@trpc/server/adapters/next";
import { createContext } from "~server/context";
import { appRouter } from "~/server/api/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { logged } from "lib/wrappers";

const handler = logged((req) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext
  })
);

export { handler as GET, handler as POST };
```

## With [NextAuth](https://next-auth.js.org/getting-started/example)
Adapted from [here](https://next-auth.js.org/configuration/initialization#route-handlers-app)

```ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import { logged } from "lib/wrappers";
import GithubProvider from "next-auth/providers/github";

const handler = logged(
  NextAuth({
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET
      })
    ]
  })
);

export { handler as GET, handler as POST };
```


## With [Uploadthing](https://uploadthing.com/)
Adapted from [here](https://docs.uploadthing.com/nextjs/appdir#create-a-nextjs-api-route-using-the-filerouter)

```ts
/** app/api/uploadthing/route.ts */

import { createNextRouteHandler } from "uploadthing/next";
import { logged } from "lib/wrappers";
 
import { ourFileRouter } from "./core";
 
 // Get route handlers for Next App Router
const { GET: _GET, POST: _POST } = createNextRouteHandler({
  router: ourFileRouter,
});

// Wrap and export routes for Next App Router
export const GET = logged(_GET);
export const POST = logged(_POST);
```

# Acknowledgements
This project builds on top of patterns from [`nextjs-handler-middleware`](https://github.com/rexfordessilfie/nextjs-handler-middleware).
