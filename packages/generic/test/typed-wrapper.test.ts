import test from "ava";

import { typedWrapperCreator, nextFuncSymbol } from "../src";

const createBinOpWrapper =
  typedWrapperCreator<
    [number, number, { foo: string } & Record<string, any>]
  >();

const binOpLogger = createBinOpWrapper((next, a, b, ctx) => {
  ctx.foo = "bar";
  console.log(`a:${a}, b:${b}, op:${next[nextFuncSymbol].name}`);
  const result = next();
  return result;
});

const addWithLogging = binOpLogger(function add(
  a: number,
  b: number,
  _ctx: { foo: string; bar: number }
) {
  return a + b;
});

test("should return execute with correct result and types", (t) => {
  const ctx = {} as Parameters<typeof addWithLogging>[2];
  const result = addWithLogging(2, 4, ctx);

  t.is(result, 6);
  t.deepEqual(ctx, { foo: "bar" });
});
