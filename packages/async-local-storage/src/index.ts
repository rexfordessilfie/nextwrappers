import { DefaultExt, wrapper } from "../../core";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Runs a callback within the async local storage context
 * @param storage The async local storage instance
 * @param store The data to store
 * @param callback The callback to run within the async local storage context
 * @param args The arguments to pass to the callback
 * @returns The return value of the callback
 */
function runWithAsyncLocalStorage<
  Store = unknown,
  ReturnType = unknown,
  Args extends any[] = any[]
>(
  storage: AsyncLocalStorage<Store>,
  store: Store,
  callback: (...args: Args) => ReturnType,
  args: Args
) {
  return storage.run(store, callback, ...args);
}

/**
 * Creates an async local storage wrapper for a route handler
 * @param options The options including an optional async local `storage`
 * instance and an `initialize` function which receives the request
 * and returns the `store`
 * @returns
 */
export function asyncLocalStorage<Store>(
  options: AsyncLocalStorageWrapperOptions<Store>
) {
  const { initialize, storage = new AsyncLocalStorage<Store>() } = options;
  storage.enterWith;
  return {
    storage,
    getStore: () => storage.getStore(),
    wrapper: wrapper((next, req, ext) => {
      const store = initialize?.(req, ext);
      return runWithAsyncLocalStorage(storage, store, next, [req, ext]);
    })
  };
}

export type AsyncLocalStorageWrapperOptions<Store> = {
  storage?: AsyncLocalStorage<Store>;
  initialize?: <Req extends Request, Ext extends DefaultExt>(
    req: Req,
    ext?: Ext
  ) => Store;
};
