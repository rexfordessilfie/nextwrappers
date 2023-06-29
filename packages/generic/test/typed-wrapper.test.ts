import test from "ava";

import { typedWrapperCreator } from "../src";

type BinOpWrapperCtx = { foo: string };
type BinOpWrapperArgs = [number, number, BinOpWrapperCtx];

const binOpWrapper = typedWrapperCreator<BinOpWrapperArgs>(); // Using never as a whole for the eventual inferred return type

const binOpLogger = binOpWrapper((next, a, b, ctx) => {
  ctx.foo = "bar";
  console.log(`a:${a}, b:${b}, op:${next._wrappedFunc.name}`);
  const result = next();

  if (Math.random() > 0.5) {
    return result;
  }

  return "hi";
});

const addWithLogging = binOpLogger(function add(a: number, b: number, _ctx) {
  return a + b;
});

test("should return execute with correct result and types", (t) => {
  const ctx = {} as Parameters<typeof addWithLogging>[2];
  const result = addWithLogging(2, 4, ctx);

  t.is(result, 6);
  t.deepEqual(ctx, { foo: "bar" });
});
