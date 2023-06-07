import test from "ava";
import { matchingPaths } from "../src";
import { createMocks } from "node-mocks-http";

test("matchingPaths - calls callback when path matches", async (t) => {
  let middlewareCallCount = 0;

  let didMatch = false;

  const wrapped = matchingPaths({ matcher: ["/dashboard/:path*"] }, (next) => {
    didMatch = true;
    return next();
  });

  const httpMock = createMocks({
    method: "GET",
    url: new URL("/dashboard", "http://localhost:3000").toString()
  });

  const middleware = wrapped((req) => {
    middlewareCallCount += 1;
    return new Response("OK", { status: 200 });
  });

  middleware(httpMock.req as any);

  t.is(typeof wrapped, "function");
  t.is(didMatch, true);
  t.is(middlewareCallCount, 1);
});

test("matchingPaths - calls callback path when no matcher provided", async (t) => {
  let middlewareCallCount = 0;

  let didMatch = false;

  const wrapped = matchingPaths({}, (next) => {
    didMatch = true;
    return next();
  });

  const httpMock = createMocks({
    method: "GET",
    url: new URL("/about", "http://localhost:3000").toString()
  });

  const middleware = wrapped((req) => {
    middlewareCallCount += 1;
    return new Response("OK", { status: 200 });
  });

  middleware(httpMock.req as any);

  t.is(typeof wrapped, "function");
  t.is(didMatch, true);
  t.is(middlewareCallCount, 1);
});

test("matchingPaths - calls callback when empty matcher provided", async (t) => {
  let middlewareCallCount = 0;

  let didMatch = false;

  const wrapped = matchingPaths(
    {
      matcher: []
    },
    (next) => {
      didMatch = true;
      return next();
    }
  );

  const httpMock = createMocks({
    method: "GET",
    url: new URL("/about", "http://localhost:3000").toString()
  });

  const middleware = wrapped((req) => {
    middlewareCallCount += 1;
    return new Response("OK", { status: 200 });
  });

  middleware(httpMock.req as any);

  t.is(typeof wrapped, "function");
  t.is(didMatch, true);
  t.is(middlewareCallCount, 1);
});

test("matchingPaths - does not call callback when path does not match", async (t) => {
  let middlewareCallCount = 0;

  let didMatch = false;

  const wrapped = matchingPaths({ matcher: ["/dashboard/:path*"] }, (next) => {
    didMatch = true;
    return next();
  });

  const httpMock = createMocks({
    method: "GET",
    url: new URL("/about", "http://localhost:3000").toString()
  });

  const middleware = wrapped((req) => {
    middlewareCallCount += 1;
    return new Response("OK", { status: 200 });
  });

  middleware(httpMock.req as any);

  t.is(typeof wrapped, "function");
  t.is(didMatch, false);
  t.is(middlewareCallCount, 1);
});
