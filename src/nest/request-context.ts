import { AsyncLocalStorage } from 'node:async_hooks';
import { Global, Inject, Injectable, Module, type DynamicModule, type MiddlewareConsumer, type NestMiddleware, type NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { resolveRequestIds, type RequestIds } from '../http/requestIds';

/**
 * The context of the request in flight, held in AsyncLocalStorage so it does not have to be
 * threaded through every layer. The middleware opens it with the request's ids; the service's
 * auth guard enriches it with who acts; use cases and repositories read it when they write.
 *
 * Generic over what the service keeps in it. A service subclasses it with its own shape and
 * registers the subclass (`RequestContextModule.forRoot(MyContextService)`), so its code
 * injects a class that says what is inside — and the middleware opens the same instance.
 */
@Injectable()
export class RequestContextService<T extends RequestIds = RequestIds> {
  private readonly storage = new AsyncLocalStorage<T>();

  run<R>(context: T, work: () => R): R {
    return this.storage.run(context, work);
  }

  get(): T | undefined {
    return this.storage.getStore();
  }

  getRequired(): T {
    const context = this.storage.getStore();
    if (!context) throw new Error('No request context bound to the current execution.');
    return context;
  }

  /**
   * Merges fields into the current context in place — what the auth guard resolved about
   * the caller. Valid because the guard runs inside the scope the middleware opened; a no-op
   * outside one.
   */
  enrich(fields: Partial<T>): void {
    const current = this.storage.getStore();
    if (!current) return;
    Object.assign(current, fields);
  }
}

/** The token under which the service's context class is reachable to the middleware. */
export const REQUEST_CONTEXT = Symbol('REQUEST_CONTEXT');

/** Opens the context for every request, with ids taken from its headers (`resolveRequestIds`). */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(@Inject(REQUEST_CONTEXT) private readonly context: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const header = (name: string): string | undefined => {
      const value = req.headers[name];
      return Array.isArray(value) ? value[0] : value;
    };
    const { requestId, correlationId, traceparent } = resolveRequestIds(header);
    res.setHeader('x-request-id', requestId);
    if (traceparent) res.setHeader('traceparent', traceparent);
    this.context.run({ requestId, correlationId }, () => next());
  }
}

@Module({})
export class RequestContextModule implements NestModule {
  /** `contextClass` is the service's subclass of `RequestContextService`, or the base. */
  static forRoot(contextClass: new () => RequestContextService<any> = RequestContextService): DynamicModule {
    return {
      module: RequestContextModule,
      global: true,
      providers: [contextClass, { provide: REQUEST_CONTEXT, useExisting: contextClass }, RequestContextMiddleware],
      exports: [contextClass, REQUEST_CONTEXT],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
