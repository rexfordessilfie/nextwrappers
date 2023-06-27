export const genericWrapper = <CArgs extends any[], CReturn>(
  cb: (next: Next, ...args: CArgs) => CReturn
) => {
  return <F extends Func<CArgs, any>>(func: F) => {
    return (...args: Parameters<F>) => {
      const next = () => func(...args);
      return cb(next as any, ...(args as any)) as
        | ReturnType<typeof cb>
        | ReturnType<F>;
    };
  };
};

export const typedWrapper = <XArgs extends any[], XReturn>() => {
  return <CArgs extends any[], CReturn extends XReturn>(
    cb: (
      next: Next,
      ...args: CArgs extends unknown[]
        ? TupleExtendsInclude<XArgs, CArgs>
        : CArgs
    ) => CReturn
  ) => {
    return <F extends Func<CArgs, any>>(func: F) => {
      return (...args: Parameters<F>) => {
        const next = () => func(...args);
        return cb(next as any, ...(args as any)) as
          | ReturnType<typeof cb>
          | ReturnType<F>;
      };
    };
  };
};

type Func<TArgs extends any[], TReturn extends unknown> = (
  ...args: TArgs
) => TReturn;

type Next = () => never;

type Append<T, U> = U extends any[] ? [...U, T] : [U, T];

type TupleExtends<
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

/**
 * Given two tuples ATuple and BTuple, take matching extends from BTuple,
 * and 'include' remaining/left over types from ATuple
 *
 * @example
 *
 *  type Test = TupleExtendsInclude<
 *    [number, { a: string }, {c: boolean}],
 *    [number, { a: string; b: string }]
 *  >; //=> [number, {a: string; b: string}, {c: boolean}]
 * */
export type TupleExtendsInclude<
  ATuple extends any[],
  BTuple extends any[],
  SoFar extends any[] = []
> = BTuple extends [infer B, ...infer BRest]
  ? ATuple extends [infer A, ...infer ARest]
    ? B extends A
      ? TupleExtendsInclude<ARest, BRest, Append<B, SoFar>> // B extends A so append B to result and recurse
      : never // B does not extend A so fail
    : never
  : ATuple extends [infer A, ...infer ARest] // Still some of ATuple left?
  ? TupleExtendsInclude<ARest, BTuple, Append<A, SoFar>> // Some of ATuple remaining so keep adding from ATuple
  : SoFar; // ATuple exhausted so return final SoFar type

type Test = TupleExtendsInclude<
  [number, { a: string }, { c: boolean }],
  [number, { a: string; b: string }]
>;
