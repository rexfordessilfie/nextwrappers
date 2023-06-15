import test from "ava";
import { chain, merge, stack, wrapper } from "../../src/pagesapi";
import { createMocks } from "node-mocks-http";
import { NextApiRequest } from "next";

test("wrapper - runs handler", async (t) => {
  let handlerCallCount = 0;

  const wrapped = wrapper(async (next) => {
    await next();
  });

  const handler = wrapped((_req, res) => {
    handlerCallCount += 1;
    res.status(200).send("OK");
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const httpMockB = createMocks({
    method: "GET",
  });

  handler(httpMock.req, httpMock.res);
  handler(httpMockB.req, httpMock.res);

  t.is(typeof wrapped, "function");
  t.is(handlerCallCount, 2);
});

test("wrapper - attaches properties to request", async (t) => {
  const wrapped = wrapper(
    async (next, req: NextApiRequest & { foo: string }) => {
      req.foo = "bar";
      return await next();
    }
  );

  const httpMock = createMocks({
    method: "GET",
  });

  const handler = wrapped((req, res) => {
    t.is(req.foo, "bar"); // test property added by wrapped
    res.status(200).send("OK");
  });

  handler(httpMock.req, httpMock.res);

  t.is(typeof wrapped, "function");
});

test("merge - runs in correct order", async (t) => {
  const order: string[] = [];
  const wrappedA = wrapper(async (next) => {
    const res = await next();
    order.push("A handler ran");
    return res;
  });

  const wrappedB = wrapper(async (next) => {
    const res = await next();
    order.push("B handler ran");
    return res;
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const wrapped = merge(wrappedA, wrappedB);

  const handler = wrapped((_req, res) => {
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(httpMock.res._getStatusCode(), 200);
  t.is(httpMock.res._getData(), "OK");
  t.deepEqual(order, ["B handler ran", "A handler ran"]);
});

test("stack - runs in correct order", async (t) => {
  const order: string[] = [];
  const wrappedA = wrapper(async (next) => {
    const res = await next();
    order.push("A handler ran");
    return res;
  });

  const wrappedB = wrapper(async (next) => {
    const res = await next();
    order.push("B handler ran");
    return res;
  });

  const wrappedC = wrapper(async (next) => {
    const res = await next();
    order.push("C handler ran");
    return res;
  });

  const httpMock = createMocks({
    method: "GET",
    query: {
      foo: "bar",
    },
  });

  const wrapped = stack(wrappedA).with(wrappedB).with(wrappedC);

  const handler = wrapped((_req, res) => {
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(httpMock.res._getStatusCode(), 200);
  t.is(httpMock.res._getData(), "OK");
  t.deepEqual(order, ["C handler ran", "B handler ran", "A handler ran"]);
});

test("chain - runs in correct order", async (t) => {
  const order: string[] = [];
  const wrappedA = wrapper(async (next) => {
    const res = await next();
    order.push("A handler ran");
    return res;
  });

  const wrappedB = wrapper(async (next) => {
    const res = await next();
    order.push("B handler ran");
    return res;
  });

  const wrappedC = wrapper(async (next) => {
    const res = await next();
    order.push("C handler ran");
    return res;
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const wrapped = chain(wrappedA).with(wrappedB).with(wrappedC);

  const handler = wrapped((_req, res) => {
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(httpMock.res._getStatusCode(), 200);
  t.is(httpMock.res._getData(), "OK");
  t.deepEqual(order, ["A handler ran", "B handler ran", "C handler ran"]);
});
