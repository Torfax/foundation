import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundException } from '../src/exceptions/HttpException';
import { errorEnvelope, successEnvelope } from '../src/http/envelope';
import { normalizeError } from '../src/http/normalizeError';
import { browserOrigins, isApiPath, parseTrustProxy } from '../src/http/proxy';
import { asUuid, parseTraceParent, resolveRequestIds } from '../src/http/requestIds';

test('el sobre: un payload, o un mensaje con su payload', () => {
  assert.deepEqual(successEnvelope({ a: 1 }, 201), { success: true, message: 'OK', payload: { a: 1 }, statusCode: 201 });
  assert.deepEqual(successEnvelope({ message: 'Listo', payload: [1] }), { success: true, message: 'Listo', payload: [1], statusCode: 200 });
  assert.deepEqual(errorEnvelope(404, 'No está'), { success: false, message: 'No está', payload: null, statusCode: 404 });
});

test('un error se reconoce por su forma: Foundation, el framework o un 500 que no revela nada', () => {
  assert.deepEqual(normalizeError(new NotFoundException('No hay trabajo', { uid: 'w-1' })), {
    statusCode: 404,
    message: 'No hay trabajo',
    details: { uid: 'w-1' },
  });

  // Así es una excepción de Nest, venga de la copia que venga.
  class FrameworkForbidden extends Error {
    getStatus() {
      return 403;
    }
    getResponse() {
      return { message: ['falta', 'permiso'], error: 'Forbidden' };
    }
  }
  assert.deepEqual(normalizeError(new FrameworkForbidden('Forbidden')), {
    statusCode: 403,
    message: 'falta, permiso',
    details: { message: ['falta', 'permiso'], error: 'Forbidden' },
  });

  assert.deepEqual(normalizeError(new Error('se rompió adentro: contraseña=123')), {
    statusCode: 500,
    message: 'Internal server error',
    details: null,
  });
});

test('los orígenes del navegador: el de la interfaz humana y los que se suman, nada más', () => {
  assert.deepEqual(
    [...browserOrigins('http://localhost:4750/', ' https://torfax.app , https://otra.example/ruta')].sort(),
    ['http://localhost:4750', 'https://otra.example', 'https://torfax.app'],
  );
  assert.equal(browserOrigins(undefined).size, 0);
  assert.equal(browserOrigins('no es una url', ',,').size, 0);
});

test('una ruta es de la API por segmentos, no por prefijo de texto', () => {
  const prefixes = ['/v1', '/mcp', '/.well-known', '/health'];
  for (const path of ['/v1', '/v1/works', '/mcp', '/health', '/.well-known/oauth-protected-resource', '/v1?x=1']) {
    assert.equal(isApiPath(path, prefixes), true, path);
  }
  for (const path of ['/', '/trabajos/abc', '/v1x', '/healthy']) {
    assert.equal(isApiPath(path, prefixes), false, path);
  }
});

test('TRUST_PROXY: vacía no confía, `true` es un salto, un número son saltos, lo demás pasa tal cual', () => {
  for (const off of [undefined, '', 'false', '0']) assert.equal(parseTrustProxy(off), undefined);
  assert.equal(parseTrustProxy('true'), 1);
  assert.equal(parseTrustProxy('2'), 2);
  assert.equal(parseTrustProxy('loopback'), 'loopback');
});

test('un uuid en su forma canónica; lo demás no', () => {
  assert.equal(asUuid('B096BB7D-5206-4963-BB5C-46FFDBF1E3A8'), 'b096bb7d-5206-4963-bb5c-46ffdbf1e3a8');
  assert.equal(asUuid('4bf92f3577b34da6a3ce929d0e0e4736'), '4bf92f35-77b3-4da6-a3ce-929d0e0e4736');
  // Un proxy que le agrega un sufijo hacía fallar cada fila del rastro.
  assert.equal(asUuid('b096bb7d-5206-4963-bb5c-46ffdbf1e3a8/xi3y'), null);
  assert.equal(asUuid('b096bb7d5-206-4963-bb5c-46ffdbf1e3a8'), null);
  assert.equal(asUuid('pedido-1'), null);
  assert.equal(asUuid(undefined), null);
});

test('traceparent: versión 00 y nada de ceros', () => {
  assert.deepEqual(parseTraceParent('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'), {
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
    flags: '01',
  });
  assert.equal(parseTraceParent('00-00000000000000000000000000000000-00f067aa0ba902b7-01'), null);
  assert.equal(parseTraceParent('not-a-trace'), null);
});

test('los ids de un pedido: los del llamador si son uuids, la traza si la hay, y si no uno nuevo', () => {
  const headers = (values: Record<string, string>) => (name: string) => values[name];

  const given = resolveRequestIds(
    headers({ 'x-request-id': 'b096bb7d-5206-4963-bb5c-46ffdbf1e3a8', 'x-correlation-id': '0aa0b0c0-1111-4222-8333-444455556666' }),
  );
  assert.equal(given.requestId, 'b096bb7d-5206-4963-bb5c-46ffdbf1e3a8');
  assert.equal(given.correlationId, '0aa0b0c0-1111-4222-8333-444455556666');
  assert.equal(given.traceparent, undefined);

  const traced = resolveRequestIds(headers({ traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' }));
  assert.equal(traced.correlationId, '4bf92f35-77b3-4da6-a3ce-929d0e0e4736');
  assert.match(traced.traceparent ?? '', /^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);

  const fresh = resolveRequestIds(headers({ 'x-request-id': 'no-es-uuid' }));
  assert.notEqual(asUuid(fresh.requestId), null);
  assert.equal(fresh.correlationId, fresh.requestId);
});
