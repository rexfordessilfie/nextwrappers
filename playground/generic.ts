import { NextRequest } from "next/server";

export type Func<TArgs extends any[] = any[], TReturn extends unknown = any> = (
  ...args: TArgs
) => TReturn | Promise<TReturn>;

export const typedWrapper = <
  XReturn extends any = void,
  XArgs extends any[] = unknown[]
>() => {
  return (
    cb: <CArgs extends XArgs, CReturn>(
      next: () => XReturn,
      ...args: XArgs extends unknown[] ? any[] : TupleExtends<XArgs, CArgs>
    ) => CReturn
  ) => {
    return <F extends Func>(func: F) => {
      return (...args: Parameters<F>) => {
        // TODO: allow overriding args through next
        const next = async () => func(...args);
        return cb(next as any, ...(args as any)) as
          | ReturnType<typeof cb>
          | ReturnType<F>;
      };
    };
  };
};

type Append<T, U> = U extends any[] ? [...U, T] : [U, T];

export type TupleExtends<
  ATuple extends any[],
  BTuple extends any[],
  SoFar extends any[] = []
> = BTuple extends [infer B, ...infer BRest]
  ? ATuple extends [infer A, ...infer ARest]
    ? B extends A
      ? TupleExtends<ARest, BRest, Append<B, SoFar>> // Recurse and accumulate result
      : never // B does not extend A so end
    : never
  : ATuple extends [infer _A, ...infer _ARest]
  ? never
  : SoFar;

type TestExtendsArgs2 = TupleExtends<[number, string], [3]>;
type TestExtendsArgs3 = TupleExtends<[number, string], [number, "hi"]>;

type Extends<A, B> = B extends A ? true : false;

type TestExtends = Extends<
  [number, NextRequest],
  [number, NextRequest & { b: boolean }]
>;

/* export type CreateWrapper<
  XReturn extends any = void,
  XArgs extends any[] = any[]
> = () => <TArgs extends any[] = XArgs, TReturn = XReturn>(
  cb: (next: () => TReturn, ...args: TArgs) => TReturn
) => (func: Func<TArgs, TReturn>) => (...args: TArgs) => ReturnType<typeof cb>; */
