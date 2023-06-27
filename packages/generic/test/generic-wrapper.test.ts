import test from "ava";

import { createMocks } from "node-mocks-http";

import { genericWrapper } from "../src";

test("genericWrapper - runs handler", async (t) => {
  let handlerCallCount = 0;

  const wrapped = genericWrapper(async (next, _req) => {
    return await next();
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const httpMockB = createMocks({
    method: "GET",
  });

  const handler = wrapped((_req) => {
    handlerCallCount += 1;
    return new Response("OK", { status: 200 });
  });

  handler(httpMock.req as any);
  handler(httpMockB.req as any);

  t.is(typeof wrapped, "function");
  t.is(handlerCallCount, 2);
});

test("genericWrapper - attaches properties to request", async (t) => {
  const wrapped = genericWrapper(
    async (next, req: Request & { foo: string }) => {
      req.foo = "bar";
      return await next();
    }
  );

  const httpMock = createMocks({
    method: "GET",
  });

  const handler = wrapped((req) => {
    t.is(req.foo, "bar"); // test property added by wrapped
    return new Response("OK", { status: 200 });
  });

  handler(httpMock.req as any);

  t.is(typeof wrapped, "function");
});
