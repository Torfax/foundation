import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  Catch,
  Logger,
  type ArgumentsHost,
  type CallHandler,
  type ExceptionFilter,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { browserErrorPage } from '../http/browserErrorPage';
import { errorEnvelope, successEnvelope, type ApiEnvelope } from '../http/envelope';
import { normalizeError } from '../http/normalizeError';
import { isApiPath, parseTrustProxy } from '../http/proxy';

/*
    Three rules hold this file together, because a service links Foundation with `file:` and
    may end up with two copies of Nest and rxjs — its own and Foundation's:

    - never `instanceof` against a Nest class (errors are recognised by shape: `normalizeError`);
    - never inject a Nest class by type;
    - rxjs is taken from the Observable that arrives, not imported.
*/

export interface ResponseInterceptorOptions {
  /** Paths answered as they are: a standard's own document (OpenAPI, RFC 9728) stops being one inside an envelope. */
  passthrough?: (path: string) => boolean;
  /** `Cache-Control` on every answer — `no-store` for a service whose every answer is live state behind a credential. */
  cacheControl?: string;
}

/** Wraps every successful answer in the envelope (`successEnvelope`). */
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T> | T> {
  constructor(private readonly options: ResponseInterceptorOptions = {}) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T> | T> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    if (this.options.cacheControl) response.setHeader('Cache-Control', this.options.cacheControl);
    const passthrough = this.options.passthrough?.(request.path) ?? false;

    const source = next.handle();
    // The Observable class of whoever produced `source` — the service's rxjs, not Foundation's.
    const ObservableOf = source.constructor as new (
      subscribe: (subscriber: { next(v: unknown): void; error(e: unknown): void; complete(): void }) => unknown,
    ) => Observable<ApiEnvelope<T> | T>;

    return new ObservableOf((subscriber) => {
      const subscription = source.subscribe({
        next: (data) => subscriber.next(passthrough ? data : successEnvelope(data, response.statusCode ?? 200)),
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }
}

export interface HttpExceptionFilterOptions {
  /** The service's name, on the page a browser gets («Arcana», «Desktop»). */
  service?: string;
  /** What the service is, said to a person who reached an address with no page. */
  notFoundLead?: string;
  /** Where to send that person: the human interface (Blue). */
  homeUrl?: string;
  /** The web interface's `index.html`, when this origin serves one (see `configureStaticWeb`). */
  webIndexFile?: string;
  /** What is API on this origin: a 404 there stays a 404, never the web's `index.html`. */
  apiPrefixes?: readonly string[];
}

/**
 * Every error, in the envelope — plus two answers for people and one for standards:
 *
 * - a navigation (GET, `Accept: text/html`) to a page only the web's client router knows gets
 *   the web's `index.html` (the SPA fallback), never under an API path;
 * - any other request asking for HTML gets a page that says where to go (`browserErrorPage`);
 * - `Accept: application/problem+json` gets RFC 9457 problem details.
 *
 * REST and MCP clients ask with a wildcard and keep receiving the envelope.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  constructor(private readonly options: HttpExceptionFilterOptions = {}) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const { statusCode, message, details } = normalizeError(exception);

    if (statusCode >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }

    const accept = request.headers.accept ?? '';
    const wantsHtml = accept.includes('text/html');

    if (
      statusCode === 404 &&
      wantsHtml &&
      request.method === 'GET' &&
      this.options.webIndexFile &&
      !isApiPath(request.path, this.options.apiPrefixes ?? [])
    ) {
      response.status(200).setHeader('Cache-Control', 'no-cache');
      response.sendFile(this.options.webIndexFile);
      return;
    }

    if (wantsHtml) {
      const home = (this.options.homeUrl ?? '').replace(/\/$/, '');
      response
        .status(statusCode)
        .type('html')
        .send(
          browserErrorPage({
            statusCode,
            message,
            service: this.options.service ?? 'Torfax',
            notFoundLead: this.options.notFoundLead,
            homeUrl: home || undefined,
          }),
        );
      return;
    }

    if (accept.includes('application/problem+json')) {
      response
        .status(statusCode)
        .type('application/problem+json')
        .json({
          type: `https://torfax.dev/problems/http-${statusCode}`,
          title: statusCode >= 500 ? 'Internal Server Error' : message,
          status: statusCode,
          detail: message,
          instance: request.originalUrl,
          ...(details === null ? {} : { errors: details }),
        });
      return;
    }

    response.status(statusCode).json(errorEnvelope(statusCode, message, details));
  }
}

/**
 * Serves a web interface's static build from the same origin as the API: one address for the
 * person and for the agent. What Vite emits under `/assets/` is content-hashed and cached
 * forever; `index.html` and the rest revalidate every time, or a new release would hide
 * behind the browser's cache. Returns the `index.html` the error filter falls back to.
 */
export function configureStaticWeb(app: NestExpressApplication, webDist: string): string {
  const index = join(webDist, 'index.html');
  if (!existsSync(index)) {
    throw new Error(`WEB_DIST=${webDist} has no index.html: build the web interface first.`);
  }
  app.useStaticAssets(webDist, {
    index: 'index.html',
    setHeaders: (res: Response, filePath: string) => {
      const immutable = /[\\/]assets[\\/]/.test(filePath);
      res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });
  return index;
}

/** CORS for a fixed list of browser origins (`browserOrigins`). Bearer tokens only: no cookie crosses. */
export function corsOptions(allowed: ReadonlySet<string>): CorsOptions {
  return {
    origin: (origin, callback) => callback(null, origin !== undefined && allowed.has(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'If-Match', 'If-None-Match', 'X-Correlation-Id', 'X-Request-Id', 'traceparent'],
    // A write answers 409 with the version it found; a download carries its name and digest.
    exposedHeaders: ['ETag', 'Content-Disposition', 'X-Request-Id', 'Retry-After', 'WWW-Authenticate'],
    maxAge: 600,
    credentials: false,
  };
}

/** A connect-style middleware, said by shape: the service's Express types and Foundation's are two copies. */
export type Middleware = (req: any, res: any, next: (error?: unknown) => void) => void;

export interface HttpSetupOptions {
  /** Express `trust proxy`, as written in `TRUST_PROXY`; unset = reached directly. */
  trustProxy?: string;
  /** Which browser origins may call: a fixed list, or the service's own middleware (Platform's). */
  cors?: ReadonlySet<string> | Middleware;
  /** The web interface's static build, when this origin serves one. */
  webDist?: string;
  /** Global pipes. The service builds them: validation belongs to the service's own copy of its validator. */
  pipes?: Parameters<NestExpressApplication['useGlobalPipes']>;
  response?: ResponseInterceptorOptions;
  errors?: Omit<HttpExceptionFilterOptions, 'webIndexFile'>;
}

/**
 * The HTTP shape every service shares: proxy trust, CORS, the static web, the envelope and
 * the error filter. `main.ts` and the e2e suites call it, so what a test proves is what runs.
 */
export function applyHttpSetup(app: NestExpressApplication, options: HttpSetupOptions = {}): void {
  const trust = parseTrustProxy(options.trustProxy);
  if (trust !== undefined) app.set('trust proxy', trust);

  if (typeof options.cors === 'function') app.use(options.cors);
  else if (options.cors && options.cors.size > 0) app.enableCors(corsOptions(options.cors));

  const webIndexFile = options.webDist ? configureStaticWeb(app, options.webDist) : undefined;

  if (options.pipes?.length) app.useGlobalPipes(...options.pipes);
  app.useGlobalInterceptors(new ResponseInterceptor(options.response));
  app.useGlobalFilters(new HttpExceptionFilter({ ...options.errors, webIndexFile }));
}
