import test from "ava";
import { NextApiRequest, NextApiResponse } from "next";
import { asyncLocalStorage } from "../src/pagesapi";
import { createMocks } from "node-mocks-http";

test("invokes handler with async local storage", async (t) => {
  let callCount = 0;
  const { wrapper, getStore } = asyncLocalStorage({
    initialize: () => "1234",
  });

  const handler = wrapper(function (
    _req: NextApiRequest,
    res: NextApiResponse<string>
  ) {
    callCount += 1;
    t.is(getStore(), "1234");
    res.send("OK");
  });

  const { req, res } = createMocks({
    method: "GET",
  });

  await handler(req, res);

  t.is(callCount, 1);
});
