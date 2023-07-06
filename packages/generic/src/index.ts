/**
 * Create a wrapper for a function. The function's types are inferred from he wrapper's args.
 */
export const createWrapper = <CArgs extends any[], CReturn>(
  cb: (next: Next, ...args: CArgs) => CReturn
) => {
  return <FArgs extends any[], FReturn extends any>(
    func: (
      ...args: FArgs extends unknown[]
        ? TupleExtendsSpreadBidirectional<
            Parameters<typeof cb> extends [infer _, ...infer CArgs]
              ? CArgs
              : any[],
            FArgs
          >
        : FArgs
    ) => FReturn
  ) => {
    return (...args: Parameters<typeof func>) => {
      const next = (() => func(...(args as any))) as Parameters<typeof cb>[0];
      next[nextFuncSymbol] = func;
      return cb(
        next as any,
        ...(args as any)
      ) as CReturn extends BaseNextReturnType
        ? Replace<CReturn, BaseNextReturnType, ReturnType<typeof func>>
        : Exclude<CReturn, BaseNextReturnType>;
    };
  };
};

/**
 * Create a wrapper creator with function type specified directly with generic types.
 */
export const typedWrapperCreator = <
  TArgs extends any[] = any[],
  TReturn extends any = any
>() => {
  return <CArgs extends any[], CReturn extends TReturn>(
    cb: (
      next: Next,
      ...args: CArgs extends unknown[]
        ? TupleExtendsSpreadBase<TArgs, CArgs>
        : CArgs
    ) => CReturn
  ) => {
    return <FArgs extends any[], FReturn>(
      func: (
        ...args: // FArgs extends unknown[]
        // ?

        TupleExtendsSpreadBase<
          Parameters<typeof cb> extends [infer _N, ...infer Args]
            ? Args
            : any[],
          FArgs
        >
      ) => // : FArgs
      FReturn
    ) => {
      return (...args: Parameters<typeof func>) => {
        const next = (() => func(...(args as any))) as Parameters<typeof cb>[0];
        next[nextFuncSymbol] = func;
        return cb(
          next as any,
          ...(args as any)
        ) as CReturn extends BaseNextReturnType
          ? Replace<CReturn, BaseNextReturnType, ReturnType<typeof func>>
          : Exclude<CReturn, BaseNextReturnType>;
      };
    };
  };
};

declare const brand: unique symbol;

type Branded<T, TBrand extends string> = T & {
  [brand]: TBrand;
};

type NextReturnTypeBrand = "NextReturnType";

export type BaseNextReturnType = Branded<{}, NextReturnTypeBrand>;

type BrandWithNextReturnType<T> = T extends BaseNextReturnType
  ? T
  : Branded<T, NextReturnTypeBrand>;

export const nextFuncSymbol = Symbol("nextFunc");
type Func<TArgs extends any[], TReturn extends unknown> = (
  ...args: TArgs
) => TReturn;

type Next<TDefaultReturnType = BaseNextReturnType> = (<
  TReturnType = TDefaultReturnType
>() => BrandWithNextReturnType<TReturnType>) & {
  [nextFuncSymbol]: Function;
};

type Append<T, U> = U extends any[] ? [...U, T] : [U, T];

type Replace<T, U, V> = Exclude<T, U> | V;

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
type TupleExtendsSpreadBase<
  ATuple extends any[],
  BTuple extends any[],
  SoFar extends any[] = []
> = BTuple extends [infer B, ...infer BRest]
  ? ATuple extends [infer A, ...infer ARest]
    ? B extends A
      ? TupleExtendsSpreadBase<ARest, BRest, Append<B, SoFar>> // B extends A so append B to result and recurse
      : never // B does not extend A so fail
    : never
  : [...SoFar, ...ATuple]; // BTuple exhausted so return spread base (ATuple)

type TupleExtendsSpreadBidirectional<
  ATuple extends any[],
  BTuple extends any[],
  SoFar extends any[] = []
> = BTuple extends [infer B, ...infer BRest]
  ? ATuple extends [infer A, ...infer ARest]
    ? B extends A
      ? TupleExtendsSpreadBidirectional<ARest, BRest, Append<B, SoFar>> // B extends A so append B to result and recurse
      : never // B does not extend A so fail
    : [...SoFar, ...BTuple] // A exhausted, so spread B
  : [...SoFar, ...ATuple]; // B exhausted, so spread A
