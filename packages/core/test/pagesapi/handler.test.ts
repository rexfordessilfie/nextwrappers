import { createMocks } from "node-mocks-http";
import { createApiHandler, wrapper } from "../../src/pagesapi";
import test from "ava";

const h = createApiHandler();

h.GET((_req, res) => {
  res.send("GET");
});

h.POST((_req, res) => {
  res.send("POST");
});

h.PUT((_req, res) => {
  res.send("PUT");
});

h.PATCH((_req, res) => {
  res.send("PATCH");
});

h.DELETE((_req, res) => {
  res.send("DELETE");
});

test("calls GET handler method", async (t) => {
  let httpMock = createMocks({
    method: "GET",
  });

  h(httpMock.req, httpMock.res);
  t.is(httpMock.res._getData(), "GET");
});

test("calls POST handler method", async (t) => {
  let httpMock = createMocks({
    method: "POST",
  });

  h(httpMock.req, httpMock.res);
  t.is(httpMock.res._getData(), "POST");
});

test("calls DELETE handler method", async (t) => {
  let httpMock = createMocks({
    method: "DELETE",
  });

  h(httpMock.req, httpMock.res);
  t.is(httpMock.res._getData(), "DELETE");
});

test("calls PATCH handler method", async (t) => {
  let httpMock = createMocks({
    method: "PATCH",
  });

  h(httpMock.req, httpMock.res);
  t.is(httpMock.res._getData(), "PATCH");
});

test("calls PUT handler method", async (t) => {
  let httpMock = createMocks({
    method: "PUT",
  });

  h(httpMock.req, httpMock.res);
  t.is(httpMock.res._getData(), "PUT");
});
