import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVersion, versionedName } from '../src/config/buildVersion';
import { ConfigService } from '../src/config/ConfigService';
import { postgresDataSourceOptions } from '../src/data/adapters/typeorm/postgresDataSourceOptions';

test('la versión liberada sale de la imagen; fuera de una, es dev', () => {
  assert.deepEqual(buildVersion({ TORFAX_VERSION: 'v0.5.2', TORFAX_COMMIT: 'abc1234' }), { tag: 'v0.5.2', commit: 'abc1234' });
  assert.deepEqual(buildVersion({}), { tag: 'dev', commit: null });
  assert.equal(versionedName('Arcana', { TORFAX_VERSION: 'v0.5.2' }), 'Arcana v0.5.2');
  assert.equal(versionedName('Arcana', {}), 'Arcana dev');
});

test('las opciones de Postgres: de DB_*, sin sincronizar, y la contraseña siempre como texto', () => {
  const saved = { ...process.env };
  try {
    Object.assign(process.env, {
      DB_HOST: 'localhost',
      DB_PORT: '5433',
      DB_USERNAME: 'torfax',
      DB_PASSWORD: '123456',
      DB_DATABASE: 'arcana_dev',
      DB_LOGGING: '',
    });
    class Entity {}
    const options = postgresDataSourceOptions(new ConfigService(), [Entity]);
    assert.deepEqual(options, {
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'torfax',
      password: '123456',
      database: 'arcana_dev',
      entities: [Entity],
      synchronize: false,
      logging: ['error'],
    });
  } finally {
    process.env = saved;
  }
});
