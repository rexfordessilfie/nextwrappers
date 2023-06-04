/**
 * Create a wrapper for a Next.js middleware handler
 * @param cb The callback for the wrapper which yields
 * request execution to the wrapper
 * @returns a middleware wrapper
 */
export function wrapperM<
  Req extends Request = Request,
  Res extends Response | void | null | undefined = Response
>(cb: MiddlewareWrapperCallback<Req, Res>) {
  return function <
    MReq extends Request = Request,
    MRes extends Response | Promise<Response> | void = void
  >(middleware: (req: MReq & Req) => MRes) {
    // the new middleware
    return (req: MReq & Req) => {
      return cb(
        (_req) =>
          middleware((_req || req) as unknown as MReq & Req) as unknown as Res,
        req as unknown as Req
      ) as unknown as ReturnType<typeof middleware>;
    };
  };
}

/**
 * Merge two middleware wrappers together
 * @param a The last applied middleware wrapper
 * @param b The first applied middleware wrapper
 * @returns
 */
export function mergeM<
  A extends MiddlewareWrapper<any, any>,
  B extends MiddlewareWrapper<any, any>
>(a: A, b: B) {
  return function <
    Req extends InferMiddlewareReq<A> & InferMiddlewareReq<B>,
    Res extends Response | Promise<Response>
  >(middleware: Middleware<Req, Res>) {
    return a(b(middleware));
  };
}

/**
 * Create a stack of middleware wrappers
 * @param a The last middleware wrapper to be applied
 * @returns
 */
export function stackM<A extends MiddlewareWrapper<any, any>>(a: A) {
  const _stack = (middleware: InferMiddleware<A>): typeof middleware =>
    a(middleware);
  _stack.kind = "stack" as "stack";

  /**
   * Add a middleware wrapper to the stack
   * @param b The first middleware wrapper to be applied in the stack
   * @returns
   */
  _stack.with = <B extends MiddlewareWrapper<any, any>>(b: B) =>
    stackM(mergeM(a, b));

  return _stack;
}

/**
 * Create a chain of middleware wrappers
 * @param a The first middleware wrapper to be applied in the chain
 * @returns
 */
export function chainM<A extends MiddlewareWrapper<any, any>>(a: A) {
  const _chain = (middleware: InferMiddleware<A>): typeof middleware =>
    a(middleware);
  _chain.kind = "chain" as "chain";

  /**
   * Add a middleware wrapper to the chain
   * @param b The last middleware wrapper to be applied in the chain
   * @returns
   */
  _chain.with = <B extends MiddlewareWrapper<any, any>>(b: B) =>
    chainM(mergeM(b, a));

  return _chain;
}

export type MiddlewareWrapper<
  Req extends Request = Request,
  Res extends Response | void | null | undefined = void
> = (h: Middleware<Req, Res>) => Res;

export type Middleware<
  Req extends Request = Request,
  Res extends Promise<Response> | Response | void | null | undefined = void
> = (req: Req) => Res;

export type InferMiddlewareReq<
  T extends MiddlewareWrapper<Request, Response> | Middleware<Request, Response>
> = T extends MiddlewareWrapper<infer Req, any>
  ? Req
  : T extends Middleware<infer Req, any>
  ? Req
  : never;

export type InferMiddleware<W extends MiddlewareWrapper<Request, Response>> =
  Parameters<W>[0];

export type MiddlewareWrapperCallback<
  Req extends Request = Request,
  Res extends Response | void | null | undefined = void
> = (next: (req?: Req) => Res | Promise<Res>, req: Req) => Promise<Res> | Res;
