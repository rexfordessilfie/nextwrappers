import test from "ava";

import { typedWrapper } from "../src";

type BinOpWrapperCtx = { foo: string };
type BinOpWrapperArgs = [number, number, BinOpWrapperCtx]; // Using `never` as a whole here for the ctx

const binOpWrapper = typedWrapper<BinOpWrapperArgs, never>(); // Using never as a whole for the eventual inferred return type

const binOpLogger = binOpWrapper((next, a, b, ctx) => {
  ctx.foo = "bar";
  console.log(`a:${a}, b:${b}, op:${next._wrapped.name}`);
  const result = next();

  return result;
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
