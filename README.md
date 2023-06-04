# next-route-handler-wrappers 🎁
Reusable, composable middleware for Next.js App Router [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/router-handlers).

## Instructions 🚀
1. First install the library using your favorite package manager:

    **Using NPM**
    ```bash
    npm install next-route-handler-wrappers
    ```
    **Using Yarn**
    ```bash
    yarn add next-route-handler-wrappers
    ```
2. Next, define a wrapper function with `wrapper`, as follows:

    ```ts
    // lib/wrappers/traced-wrapper.ts
    import { wrapper } from "next-route-handler-wrappers";
    import { NextRequest } from "next/server";

    export const traced = wrapper(
      async (request: NextRequest & { traceId: string }, ext, next) => {
        // Do something before fulfilling request...(e.g connect to your database, add a tracer id to the request, etc.)

        // Attach any extra properties you want to the request
        request.traceId = "1234";

        // Execute the request
        const response = await next();

        // Do something after executing the request...(e.g log request duration, emit some analytics, etc.)

        // Return the response
        return response;
      }
    );
    ```

3. Finally, wrap the wrapper around an Next.js API handler in a pages/api file:
    ```ts
    // app/api/hello/route.ts
    import { traced } from "lib/wrappers/my-wrapper.ts";
    import { NextResponse } from "next/server";

    export const GET = traced((request) => {
      // Access properties provided by the wrapper
      console.log(request.traceId);
      // => "1234"

      // Respond to the request!
      return NextResponse.json({ message: "Hello from Next.js API!" });
    });
    ```

## Features ✨
### `wrapper()`
This lets you create a wrapper around a route handler that performs some arbitrary piece of logic. 

It gives you access to the route handler's `request`, an `ext` object containing path parameters, and a `next` function for executing the wrapped route handler.


**Example - `authenticated`**: Ensure a user has been authenticated with next-auth before continuing with request, then attach current user to the request.
```ts
import { getServerSession } from "next-auth/react";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "app/api/auth/[...nextauth]/route.ts";

import { wrapper } from "next-route-handler-wrappers";

export const authenticated = wrapper(
  async (request: NextRequest & { user: Session["user"] }, ext, next) => {
    const { user } = await getServerSession(authOptions);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 500 });
    }

    request.user = session.user;
    return next();
  }
);
```

**Example - `restrictedTo`**: Ensure that a user has the right role to access the API route.
```ts
import { wrapper, InferReq } from "next-route-handler-wrappers";
import { NextResponse } from "next/server";

import { authenticated } from "lib/auth-wrapper";

const ROLES = {
  guest: "guest",
  user: "user",
  admin: "admin",
  superAdmin: "superAdmin"
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];
const ROLE_LEVELS: Record<Role, number> = {
  guest: 0,
  user: 1,
  admin: 2,
  superAdmin: 3
};

export const restrictedTo = <R extends Role>(role: R) =>
  wrapper(async (request: InferReq<typeof authenticated>, _, next) => {

    const currentUserLevel = ROLE_LEVELS[request.user.role ?? ROLES.guest];
    const requiredLevel = ROLE_LEVELS[role];

    if (currentUserLevel < requiredLevel) {
      return NextResponse.json(
        { message: "Unauthorized operation!" },
        { status: 403 }
      );
    }

    return next();
  });
```

### `stack()` 
This lets you combine multiple wrappers to be applied within the same request. The wrappers are executed with the *last* wrapper being wrapped closest to the route handler.

Building from the example above, we can combine `restrictedTo` and `authenticated` wrappers to restrict a route to authenticated users with a particular role. 

```ts
import { stack } from "next-route-handler-wrappers";
import { authenticated, restrictedTo } from "lib/wrappers";

const restrictedToUser = stack(authenticated).with(restrictedTo("user"));
const restrictedToAdmin = stack(authenticated).with(restrictedTo("admin"));
const restrictedToSuperAdmin = stack(authenticated).with(
  restrictedTo("superAdmin")
);
```
  
### `chain()`
This also lets us combine wrappers similarly to `stack`, except that the wrappers are executed with the *first* wrapper being wrapped closest to the route handler.

Building from the previous example, we can express the above wrappers with `chain` as:
```ts
import { chain } from "next-route-handler-wrappers";
import { authenticated, restrictedTo } from "lib/wrappers";

const restrictedToUser = chain(restrictedTo("user")).with(authenticated);
const restrictedToAdmin = chain(restrictedTo("admin")).with(authenticated);
const restrictedToSuperAdmin = chain(restrictedTo("admin")).with(authenticated);
```
  
In general, `stack` is more ergonomic since we add onto the back, versus at the front with `chain`.
  
### `merge()`
This is the most primitive way to combine multiple wrappers. It takes in two wrapper and combines them into one. The second wrapper is wrapped closest to the route handler.

Both `stack` and `chain` are built on top of `merge`!

Again, we can express the above wrapper as:
```ts
import { merge } from "next-route-handler-wrappers";
import { authenticated, restrictedTo } from "lib/wrappers";

const restrictedToUser = merge(authenticated, restrictedTo("user"));
const restrictedToAdmin = merge(authenticated, restrictedTo("admin"));
const restrictedToSuperAdmin = merge(authenticated, restrictedTo("superAdmin"));
```

> NB: `stack` and `chain` have a `.with()` for endless wrapper combination, but `merge` does not. However, since the result of `merge` is a wrapper, we can combine multiple `merge` calls to achieve the same effect:
```ts
import { merge } from "next-route-handler-wrappers"
import { w1, w2, w3, w4 } from "lib/wrappers"

const superWrapper = merge(merge(merge(w1, w2), w3), w4);
```

## Use-Cases 📝
Here are some common ideas and use-cases for `next-route-handler-wrappers`:

### Logging x Error Handling - `logged()`
```ts
import { wrapper } from "next-route-handler-wrappers";
import { NextRequest, NextResponse } from "next/server";
import pino from "pino";

const logger = pino();

const logged = wrapper(async (request: NextRequest, { params }, next) => {
  const start = Date.now();
  const { pathname, href } = request.nextUrl;
  const referrer = request.referrer;

  logger.info(
    {
      url: href,
      referrer,
    },
    `[${request.method}] ${pathname} started`
  );

  try {
    const response = await next();

    logger.info(
      {
        params,
        status: response.status,
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
});
```

```ts
// app/api/user/[id]/route.ts
import { logged } from "lib/wrappers";
import { NextRequest, NextResponse } from "next/server";

export const GET = logged((request, { params }) => {
  const { id } = params;
  return NextResponse.json({ id });
});
```

### DB Connections (Mongoose) - `dbConnected()`
```ts
import { NextRequest } from "next/server";
import { wrapper } from "next-route-handler-wrappers";
import * as models from "lib/models";

import { dbConnect } from "lib/dbConnect"; // Source: https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/dbConnect.js

export const dbConnected = wrapper(
  async (
    request: NextRequest & { db: models; dbPromise: Promise<void> },
    ext,
    next
  ) => {
    request.dbPromise = dbConnect();
    request.db = models;
    return next();
  }
);
```

```ts
// app/api/user/[id]/route.ts
import { dbConnected } from "lib/wrappers";
import { NextRequest, NextResponse } from "next/server";

export const GET = dbConnected(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    await request.dbPromise;
    const user = await request.db.User.findById(id);
    return NextResponse.json(user);
  }
);
```

### Request Validation - `validated()`
```ts
import { wrapper } from "next-route-handler-wrappers";
import { z } from "zod";
import { NextRequest } from "next/server";

export function validated<B extends z.Schema, Q extends z.Schema>(schemas: {
  body?: B;
  query?: Q;
}) {
  return wrapper(
    async (
      next,
      req: NextRequest & { parsedBody?: z.infer<B>; parsedQuery?: z.infer<Q> }
    ) => {
      if (schemas.body) {
        req.parsedBody = schemas.body.parse(await req.json());
      }

      if (schemas.query) {
        const query: Record<string, any> = {};

        req.nextUrl.searchParams.forEach((value, key) => {
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

        req.parsedQuery = schemas.query.parse(query);
      }

      return next();
    }
  );
}
```

```ts
//app/api/user/[id]/route.ts
import { stack, wrapper } from "next-route-handler-wrappers";
import { userUpdateSchema } from "lib/schemas";
import {
  authenticated,
  dbConnected,
  logged,
  restrictedToUser,
  validated
} from "lib/wrappers";
import { NextResponse } from "next/server";

import { z } from "zod";
import { logged, validated } from "@/app/lib/wrappers";

const wrapped = stack(logged).with(dbConnected).with(authenticated);

const friends = z.string().transform(JSON.parse);
const wrappedGet = wrapped.with(
  validated({ query: z.object({ friends: friends.optional() }) })
);

export const GET = wrappedGet(async function (
  request,
  { params }: { params: { id: string } }
) {
  await request.dbPromise;
  const result = request.db.User.findById(params.id);

  if (request.parsedQuery.friends) {
    const user = await result.populate("friends");
    return NextResponse.json({ user: await user.populate("friends") });
  }

  const user = await result;
  return NextResponse.json({ user });
});

const wrappedPost = wrapped
  .with(restrictedToUser)
  .with(
    wrapper(async (next, request, { params }: { params: { id: string } }) => {
      if (request.user.id !== params.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      return next();
    })
  )
  .with(
    validated({
      body: validated(userUpdateSchema)
    })
  );

export const POST = wrappedPost(async function (
  request,
  { params }: { params: { id: string } }
) {
  const user = await request.db.User.findByIdAndUpdate(
    params.id,
    request.parsedBody,
    { new: true }
  );
  return NextResponse.json({ user });
});
```


### With [tRPC](https://trpc.io)
Adapted from [here](https://trpc.io/docs/server/adapters/nextjs#route-handlers)
```ts
// app/api/trpc/[trpc]/route.ts
import * as trpcNext from "@trpc/server/adapters/next";
import { logged } from "lib/wrappers";
import { createContext } from "~server/context";
import { appRouter } from "~/server/api/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

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

### With [NextAuth](https://next-auth.js.org/getting-started/example)
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

## Acknowledgements
This project builds on top of patterns from [`nextjs-handler-middleware`](https://github.com/rexfordessilfie/nextjs-handler-middleware).
