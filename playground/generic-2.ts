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
    cb: (next: Next, ...args: TupleExtends<XArgs, CArgs>) => CReturn
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
