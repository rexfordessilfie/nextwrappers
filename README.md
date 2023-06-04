# next-route-handler-wrappers 🎁
Reusable, composable middleware for Next.js App Router [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) and [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware).

# Instructions 🚀
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

# Features ✨
Here are some of the utility methods provided by this library.
## `wrapper()` / `wrapperM()`
This lets you create a wrapper around a route/middleware handler that performs some arbitrary piece of logic. 

It gives you access to the route handler's `request`, an `ext` object containing path parameters, and a `next` function for executing the wrapped route handler.


### Examples 

**`authenticated` wrapper**:
Ensure a user has been authenticated with next-auth before continuing with request, then attach current user to the request.
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

**`restrictedTo` wrapper**:
Ensure that a user has the right role to access the API route.
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

## `stack()` / `stackM()`
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
  
## `chain()` / `chainM()`
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
  
## `merge()` / `mergeM()` 
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

> The `stack` and `chain` have a `.with()` for endless wrapper combination, but `merge` does not. However, since the result of `merge` is a wrapper, we can combine multiple `merge` calls to achieve the same effect:
```ts
import { merge } from "next-route-handler-wrappers"
import { w1, w2, w3, w4 } from "lib/wrappers"

const superWrapper = merge(merge(merge(w1, w2), w3), w4);
```

# Use-Cases 📝
Here are some common ideas and use-cases for `next-route-handler-wrappers`:

## Matching Paths in `middleware.ts`
We can define a `withMatched` wrapper that selectively applies a middleware logic based on the request path, building on top of Next.js' ["Matching Paths"](https://nextjs.org/docs/app/building-your-application/routing/middleware#matching-paths) documentation.
### `withMatched()`
```ts
import { wrapperM, MiddlewareWrapperCallback } from "next-route-handler-wrappers";

type MatchConfig = {
  paths?: RegExp[];
};

/**
 * A wrapper that only applies the wrapped handler if the request matches the given paths
 * @param config
 * @param cb
 * @returns
 */
function withMatched<Req extends Request, Res extends Response | void>(
  config: MatchedConfig = { paths: [] },
  cb: MiddlewareWrapperCallback<Req, Res>
) {
  const { paths } = config;
  const pathsRegex = paths
    ? new RegExp(paths.map((r) => r.source).join("|"))
    : /.*/;
  return wrapperM<Req, Res>((next, req) => {
    const isMatch = pathsRegex.test(new URL(req.url).pathname)
    if (isMatch){
      return cb(next, req);
    }
    return next();
  });
}
```

### Usage - Middleware Logging:
We can define a basic middleware that only logs a greeting for requests that match a certain path.
```ts
// middleware.ts
import { withMatched } from "lib/wrappers";


const withMatchedGreeting = withMatched(
  { paths: [/^\/api(\/.*)?$/] },
  (next, req: NextRequest) => {
    console.log(`Hello '${req.nextUrl.pathname}'!`);
    const res = next();
    console.log(`Goodbye '${req.nextUrl.pathname}'!`);
    return res;
  }
);

export const middleware = withMatchedGreeting(() => {
  return NextResponse.next();
});
```

### Usage - Middleware Authentication
Or we can define an authentication middleware that only applies to certain paths using NextAuth.js' `withAuth` middleware.

```ts
// middleware.ts
import withAuth, {
  NextAuthMiddlewareOptions,
  NextRequestWithAuth
} from "next-auth/middleware";
import { withMatched } from "lib/wrappers";

function withMatchedAuth(
  config?: MatchConfig,
  authOptions?: NextAuthMiddlewareOptions
) {
  return withMatched(config, (next, req: NextRequestWithAuth) =>
    // @ts-expect-error - next-auth types do not narrow down to the expected function type
    withAuth(next, authOptions ?? {})(req)
  );
}

const authMatchConfig: MatchConfig = {
  paths: [/^\/dashboard.*$/],
};

const authOptions: NextAuthMiddlewareOptions = {
  pages: {
    signIn: "/signin",
  },
};

const withAuthentication = withMatchedAuth(authMatchConfig, authOptions);

export const middleware = withMatchedAuth(() => {
  return NextResponse.next();
});
```

> NB: The above example will only invoke the `withAuth` middleware if the request matches the given paths. See the next section for a complex example that always invokes the `withAuth` middleware, but only redirects if the request matches the given paths.

## `withProtected`
If you always want to invoke the `withAuth` middleware, (for example, to set the `req.nextauth.token`) property regardless of the request path - but still redirect if the path is 'protected', you can define a custom wrapper with `wrapperM` and override `withAuth`'s redirect logic through its `authorized` callback option.

For example here we show a more complex example with multiple levels of protected paths (regular protected paths and admin-protected paths):

```ts
import withAuth, {
  NextAuthMiddlewareOptions,
  NextRequestWithAuth
} from "next-auth/middleware";

type MatchConfig = {
  paths?: RegExp[];
  adminPaths?: RegExp[];
};

function withProtectedMatchConfig(config: MatchConfig = { paths: [], adminPaths: [] }) {
  const { paths, adminPaths } = config;
  const pathsRegex = paths
    ? new RegExp(paths.map((r) => r.source).join("|"))
    : /.*/;

  const adminPathsRegex = adminPaths
    ? new RegExp(adminPaths.map((r) => r.source).join("|"))
    : /.*/;

  const authOptions: NextAuthMiddlewareOptions = {
    callbacks: {
      authorized({ token, req }) {
        const isAdminPath = adminPathsRegex.test(new URL(req.url).pathname);
        if (isAdminPath) {
          // Admin path, so allow only if token is present and user is admin
          return !!token && token.role === "admin";
        }

        const isProtectedPath = pathsRegex.test(new URL(req.url).pathname);
        if (isProtectedPath) {
          // Protected path, so allow only if token is present (NB: default behavior of withAuth)
          return !!token;
        }

        // If not protected path, allow through (i.e no redirect)
        return true;
      }
    }
  };

  // Return a wrapper that invokes withAuth with the given options
  return wrapperM((next, req: NextRequestWithAuth) =>
    // @ts-expect-error - next-auth types do not narrow down to the expected function
    withAuth(next, authOptions)(req)
  );
}
```

The above callback logic is adapted from NextAuth.js docs [here](https://next-auth.js.org/configuration/nextjs#advanced-usage).

### Usage
```ts
// middleware.ts
import { withProtectedMatchConfig, MatchConfig } from "lib/wrappers";

const protectedMatchConfig: MatchConfig = {
  paths: [/^\/dashboard.*$/],
  adminPaths: [/^\/admin.*$/],
};

const withProtected = withProtectedMatchConfig(protectedMatchConfig);

export const middleware = withProtected(() => {
  return NextResponse.next();
});
```

## Logging x Error Handling
For logging and handling errors at the route handler level, we can use a `logged` wrapper. This one uses the [`pino`](https://getpino.io/#/) logger, but you can use any logger you want.

### `logged()`
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

### Usage
```ts
// app/api/user/[id]/route.ts
import { logged } from "lib/wrappers";
import { NextRequest, NextResponse } from "next/server";

export const GET = logged((request, { params }) => {
  const { id } = params;
  return NextResponse.json({ id });
});
```

## DB Connections (Mongoose)
We can use the `dbConnected` wrapper to ensure that we have a connection ready before making database operations in a single request.

### `dbConnected()`
```ts
import { NextRequest } from "next/server";
import { wrapper } from "next-route-handler-wrappers";
import * as models from "lib/models";

import { dbConnect } from "lib/dbConnect"; // Source: https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/dbConnect.js

export const dbConnected = wrapper(
  async (
    request: NextRequest & { dbConnected: Promise<void> },
    ext,
    next
  ) => {
    request.dbConnected = dbConnect();
    return next();
  }
);
```

### Usage

```ts
// app/api/user/[id]/route.ts
import { dbConnected } from "lib/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { User } from "lib/models";

export const GET = dbConnected(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    await request.dbConnected;
    const user = await User.findById(id);
    return NextResponse.json(user);
  }
);
```

## Request Validation
We can perform validation of any parts of the request, including the body, query, or even path parameters. We can use the [`zod`](https://zod.dev) validator for this, and then attach the parsed values to the request object.
### `validated()`
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

### Usage

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
import { User } from "lib/models";

const wrapped = stack(logged).with(dbConnected).with(authenticated);

const friends = z.string().transform(JSON.parse);
const wrappedGet = wrapped.with(
  validated({ query: z.object({ friends: friends.optional() }) })
);

export const GET = wrappedGet(async function (
  request,
  { params }: { params: { id: string } }
) {
  await request.dbConnected;
  const result = User.findById(params.id);

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
      body: userUpdateSchema
    })
  );

export const POST = wrappedPost(async function (
  request,
  { params }: { params: { id: string } }
) {
  const user = await User.findByIdAndUpdate(
    params.id,
    request.parsedBody,
    { new: true }
  );
  return NextResponse.json({ user });
});
```

# Using 3rd-Party Route Handlers
## With [tRPC](https://trpc.io)
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

# Acknowledgements
This project builds on top of patterns from [`nextjs-handler-middleware`](https://github.com/rexfordessilfie/nextjs-handler-middleware).