export const createWrapper = <CArgs extends any[], CReturn>(
  cb: (next: Next, ...args: CArgs) => CReturn
) => {
  return <F extends Func<CArgs, any>>(func: F) => {
    return (...args: Parameters<F>) => {
      const next = () => func(...args);
      next._wrappedFunc = func;
      return cb(next as any, ...(args as any)) as
        | ReturnType<typeof cb>
        | ReturnType<F>;
    };
  };
};

export const typedWrapperCreator = <XArgs extends any[], XReturn>() => {
  return <CArgs extends any[], CReturn extends XReturn>(
    cb: (
      next: Next,
      ...args: CArgs extends unknown[]
        ? TupleExtendsInclude<XArgs, CArgs>
        : CArgs
    ) => CReturn
  ) => {
    return <
      F extends Func<
        Parameters<typeof cb> extends [infer _N, ...infer Args] ? Args : CArgs,
        any
      >
    >(
      func: F
    ) => {
      return (...args: Parameters<F>) => {
        const next = () => func(...(args as any));
        next._wrappedFunc = func;
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

type Next = (() => never) & { _wrappedFunc: Function };

type Append<T, U> = U extends any[] ? [...U, T] : [U, T];

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
