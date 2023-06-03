/**
 * Create a wrapper for a Next.js route handler
 * @param cb The callback for the wrapper which yields
 * request execution to the wrapper
 * @returns A route handler wrapper
 */
export function wrapper<
  Req extends Request = Request,
  Ext extends DefaultExt = DefaultExt,
  Res extends Response = Response
>(
  cb: (
    next: (req?: Req, ext?: Ext) => Res | Promise<Res>,
    req: Req,
    ext: Ext
  ) => Promise<Res> | Res
) {
  return function <
    HExt extends DefaultExt = DefaultExt,
    HReq extends Request = Request,
    HRes extends Response | Promise<Response> = Response
  >(handler: (req: HReq & Req, ext?: HExt) => HRes) {
    return function newHandler(req: HReq & Req, ext?: HExt) {
      return cb(
        (_req, _ext) =>
          handler(
            (_req || req) as unknown as HReq & Req,
            (_ext || ext) as any
          ) as unknown as Res,
        req as unknown as Req,
        ext as unknown as Ext
      ) as unknown as ReturnType<typeof handler>;
    };
  };
}

/**
 * Merge two wrappers together
 * @param a The last applied wrapper
 * @param b The first applied wrapper
 * @returns
 */
export function merge<
  A extends Wrapper<any, any, any>,
  B extends Wrapper<any, any, any>
>(a: A, b: B) {
  return function <
    Req extends InferReq<A> & InferReq<B>,
    Res extends Response | Promise<Response>
  >(handler: (req: Req, ext?: DefaultExt) => Res) {
    return a(b(handler));
  };
}

/**
 * Create a stack of wrappers
 * @param a The last wrapper to be applied
 * @returns
 */
export function stack<A extends Wrapper<any, any, any>>(a: A) {
  const _stack = (handler: InferHandler<A>): typeof handler => a(handler);
  _stack.kind = "stack";

  /**
   * Add a wrapper to the stack
   * @param b The first wrapper to be applied in the stack
   * @returns
   */
  _stack.with = <B extends Wrapper<any, any, any>>(b: B) => stack(merge(a, b));

  return _stack;
}

/**
 * Create a chain of wrappers
 * @param a The first wrapper to be applied in the chain
 * @returns
 */
export function chain<A extends Wrapper<any, any, any>>(a: A) {
  const _chain = (handler: InferHandler<A>): typeof handler => a(handler);
  _chain.kind = "chain";

  /**
   * Add a wrapper to the chain
   * @param b The last wrapper to be applied in the chain
   * @returns
   */
  _chain.with = <B extends Wrapper<any, any, any>>(b: B) => chain(merge(b, a));
  return _chain;
}

export type DefaultExt = { params?: unknown };
export type Wrapper<
  Req extends Request = Request,
  Ext extends DefaultExt = DefaultExt,
  Res extends Response | Promise<Response> = Response
> = (h: Handler<Req, Ext, Res>) => Res;

export type Handler<
  Req extends Request = Request,
  Ext extends DefaultExt = DefaultExt,
  Res extends Response | Promise<Response> = Response
> = (req: Req, ext?: Ext) => Res;

export type InferReq<
  T extends
    | Wrapper<Request, DefaultExt, Response>
    | Handler<Request, DefaultExt, Response>
> = T extends Wrapper<infer Req, any, any>
  ? Req
  : T extends Handler<infer Req, any, any>
  ? Req
  : never;

export type InferHandler<W extends Wrapper<Request, DefaultExt, Response>> =
  Parameters<W>[0];
