import { AsyncLocalStorage } from "node:async_hooks";
import { ExecutorContext } from "../../ExecutorContext";

/**
 * ExecutorContext backed by Node's AsyncLocalStorage: ambient at call-time, injected at
 * wiring-time. `current()` returns the executor bound to the running async chain, or the
 * `base` executor (the pool) when none is bound.
 */
export class AsyncLocalStorageExecutorContext<E> implements ExecutorContext<E> {
  private readonly storage = new AsyncLocalStorage<E>();

  constructor(private readonly base: () => E) {}

  current(): E {
    return this.storage.getStore() ?? this.base();
  }

  hasActive(): boolean {
    return this.storage.getStore() !== undefined;
  }

  bind<T>(executor: E, work: () => Promise<T>): Promise<T> {
    return this.storage.run(executor, work);
  }
}
