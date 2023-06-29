import test from "ava";

import { createMocks } from "node-mocks-http";

import { createWrapper, nextFuncSymbol } from "../src";

test("executes wrapped function", async (t) => {
  const myLogger = createWrapper((next, req: Request) => {
    console.log(
      `starting '${next[nextFuncSymbol].name}', method:${req.method}`
    );
    const response = next<Response>();
    console.log(`finished '${next[nextFuncSymbol].name}'`);
    response.headers.set("X-IsWrapped", "true");
    return response;
  });

  let callCount = 0;

  const httpMock = createMocks({
    method: "GET",
  });

  const handler = myLogger(function handler(_req) {
    callCount += 1;
    return new Response("OK", { status: 200 });
  });

  const response = handler(httpMock.req as any);

  t.is(typeof myLogger, "function");
  t.is(await response.text(), "OK");
  t.is(response.headers.get("X-IsWrapped"), "true");
});
