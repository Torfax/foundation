import { Global, Inject, Module, type DynamicModule, type OnModuleDestroy, type Provider } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
import { AesGcmSecretBox } from '../crypto/AesGcmSecretBox';
import { Argon2PasswordHasher } from '../crypto/Argon2PasswordHasher';
import type { JwtSigner } from '../crypto/JwtSigner';
import { Sha256SecretHasher } from '../crypto/Sha256SecretHasher';
import { UuidV7Generator } from '../core/UuidV7Generator';
import { createTypeOrmRuntime, type RelationalRuntime } from '../data/adapters/typeorm/createTypeOrmRuntime';
import { postgresDataSourceOptions } from '../data/adapters/typeorm/postgresDataSourceOptions';
import {
  APP_CONFIG,
  CONNECTOR,
  DATA_SOURCE,
  JWT_SIGNER,
  PASSWORD_HASHER,
  RELATIONAL_RUNTIME,
  SECRET_BOX,
  SECRET_HASHER,
  UID_GENERATOR,
  UNIT_OF_WORK,
} from './tokens';

/**
 * Foundation's ConfigService as a global provider. The host loads `process.env` (dotenv) in
 * `main.ts` before Nest bootstraps, so the service reads a populated environment.
 */
@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => new ConfigService() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}

export interface FoundationModuleOptions {
  /** The environment variable holding the AES-GCM master key; omit when nothing is sealed. */
  secretBoxKey?: string;
  /** Argon2id for passwords people chose. Off unless people sign in to this service. */
  passwordHasher?: boolean;
  /** For a service that mints its own tokens. */
  jwtSigner?: (config: ConfigService) => JwtSigner;
  /** What only this service needs, next to the rest (Platform's identity signer). */
  providers?: Provider[];
}

/**
 * Foundation's services as global providers, by what the service actually needs: uids and
 * hashed secrets always; sealing, passwords and token signing only when asked for. A service
 * that validates tokens by introspection should not hold a signer at all.
 */
@Module({})
export class FoundationModule {
  static forRoot(options: FoundationModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      { provide: UID_GENERATOR, useFactory: () => new UuidV7Generator() },
      { provide: SECRET_HASHER, useFactory: () => new Sha256SecretHasher() },
    ];
    if (options.secretBoxKey) {
      const key = options.secretBoxKey;
      providers.push({
        provide: SECRET_BOX,
        inject: [APP_CONFIG],
        useFactory: (config: ConfigService) => new AesGcmSecretBox(String(config.getRequired(key))),
      });
    }
    if (options.passwordHasher) {
      providers.push({ provide: PASSWORD_HASHER, useFactory: () => new Argon2PasswordHasher() });
    }
    if (options.jwtSigner) {
      const sign = options.jwtSigner;
      providers.push({ provide: JWT_SIGNER, inject: [APP_CONFIG], useFactory: (config: ConfigService) => sign(config) });
    }
    providers.push(...(options.providers ?? []));

    return {
      module: FoundationModule,
      global: true,
      providers,
      exports: providers.map((provider) => (typeof provider === 'function' ? provider : provider.provide)),
    };
  }
}

/**
 * What `DatabaseModule` needs from a DataSource class, said by shape: the service's TypeORM
 * and Foundation's are two copies whose types never match nominally.
 */
export interface DataSourceLike {
  initialize(): Promise<unknown>;
  destroy(): Promise<void>;
  readonly isInitialized: boolean;
}

export interface DatabaseModuleOptions {
  /** The service's entity classes. */
  entities: Function[];
  /**
   * The service's own `DataSource` class. Foundation linked with `file:` resolves its own copy
   * of TypeORM; building the DataSource with the service's class keeps one copy of what the
   * service's repositories and entities use.
   */
  dataSource: new (options: any) => DataSourceLike;
}

/**
 * Persistence: Nest owns when the DataSource is created and how long it lives; the wiring is
 * `createTypeOrmRuntime`. One executor context binds the Connector and the UnitOfWork, so a
 * transaction spans every repository. Options come from `DB_*` (`postgresDataSourceOptions`).
 */
@Module({})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSourceLike) {}

  /** Closes the pool when the application shuts down. */
  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) await this.dataSource.destroy();
  }

  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        {
          provide: DATA_SOURCE,
          inject: [APP_CONFIG],
          useFactory: async (config: ConfigService): Promise<DataSourceLike> => {
            const dataSource = new options.dataSource(postgresDataSourceOptions(config, options.entities));
            await dataSource.initialize();
            return dataSource;
          },
        },
        {
          provide: RELATIONAL_RUNTIME,
          inject: [DATA_SOURCE],
          // The one boundary cast: the service's DataSource and Foundation's are nominally
          // distinct types for the same thing (duck-typed at runtime).
          useFactory: (dataSource: DataSourceLike) =>
            createTypeOrmRuntime(dataSource as unknown as Parameters<typeof createTypeOrmRuntime>[0]),
        },
        { provide: CONNECTOR, inject: [RELATIONAL_RUNTIME], useFactory: (runtime: RelationalRuntime) => runtime.connector },
        { provide: UNIT_OF_WORK, inject: [RELATIONAL_RUNTIME], useFactory: (runtime: RelationalRuntime) => runtime.unitOfWork },
      ],
      exports: [DATA_SOURCE, RELATIONAL_RUNTIME, CONNECTOR, UNIT_OF_WORK],
    };
  }
}
